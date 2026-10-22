// Project 5: E-commerce Cart — Pinia, product list, shared state, computed totals, persistence.

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles.css'

createApp(App).use(createPinia()).mount('#app')
`

const stylesCss = `/* Global styles for the shop */
.shop {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  --soft: #f7f6f3;
  --accent: #3b5bdb;
  --ok: #2b8a3e;
  --danger: #c92a2a;
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px 20px 32px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.shop button,
.shop input { font: inherit; }
.shop button { cursor: pointer; }
.shop button:disabled { cursor: not-allowed; opacity: 0.45; }
.shop :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
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
`

const moneyJs = `// Prices are integer cents (see Project 3 for why).
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatCents(cents) {
  return formatter.format(cents / 100)
}
`

const productsStoreJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Sample catalogue. Prices are integer cents.
// SIMPLIFIED: a real shop loads this from an API (see Project 4).
const PRODUCTS = [
  { id: 'p1', name: 'Ceramic mug', price: 1400, stock: 5, category: 'kitchen', color: '#e8d5c4' },
  { id: 'p2', name: 'Linen tea towel', price: 900, stock: 8, category: 'kitchen', color: '#d3e4cd' },
  { id: 'p3', name: 'Cast-iron pan', price: 4500, stock: 2, category: 'kitchen', color: '#c9c9c9' },
  { id: 'p4', name: 'A5 notebook', price: 750, stock: 10, category: 'stationery', color: '#f6e7a7' },
  { id: 'p5', name: 'Fountain pen', price: 3200, stock: 3, category: 'stationery', color: '#c5d3f0' },
  { id: 'p6', name: 'Desk lamp', price: 5800, stock: 0, category: 'home', color: '#f0d0c5' },
  { id: 'p7', name: 'Wool throw', price: 6400, stock: 4, category: 'home', color: '#d9c8e8' },
  { id: 'p8', name: 'Scented candle', price: 1800, stock: 6, category: 'home', color: '#f4dcb5' },
]

// A setup store: the function body is like <script setup>.
// refs become state, computeds become getters, functions become actions.
export const useProductsStore = defineStore('products', () => {
  const all = ref(PRODUCTS.map((product) => ({ ...product })))
  const category = ref('all')

  const categories = computed(() => [...new Set(all.value.map((product) => product.category))])
  const visible = computed(() =>
    category.value === 'all' ? all.value : all.value.filter((product) => product.category === category.value),
  )

  function byId(id) {
    return all.value.find((product) => product.id === id) ?? null
  }

  function setCategory(value) {
    category.value = value
  }

  return { all, category, categories, visible, byId, setCategory }
})
`

const cartStorageJs = `// Saving and loading the cart. Only ids and quantities are stored —
// never prices or names, which must always come from the catalogue.
// (In this sandbox localStorage is in-memory and resets on every run.)

export const CART_KEY = 'vue-zero.cart.v1'

// findProduct(id) -> product or null. Unknown products are dropped and
// quantities are clamped to the CURRENT stock: it may have changed since.
export function loadCart(findProduct) {
  const empty = { items: [], couponCode: '' }
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return empty
    const data = JSON.parse(raw)
    const items = (Array.isArray(data.items) ? data.items : [])
      .filter((item) => item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Math.min(item.quantity, findProduct(item.productId)?.stock ?? 0),
      }))
      .filter((item) => item.quantity > 0)
    return { items, couponCode: typeof data.couponCode === 'string' ? data.couponCode : '' }
  } catch (error) {
    console.warn('Could not read the saved cart:', error.message)
    return empty
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch (error) {
    console.warn('Could not save the cart:', error.message)
  }
}
`

const cartStoreReturn = `  return {
    items,
    couponCode,
    lines,
    count,
    subtotal,
    discountPercent,
    discount,
    shipping,
    total,
    quantityOf,
    canAdd,
    add,
    setQuantity,
    remove,
    applyCoupon,
    removeCoupon,
    clear,
  }
})
`

const starterCartStoreJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductsStore } from './products.js'
// TODO (step 6): import { loadCart, saveCart } from './cartStorage.js'

export const FREE_SHIPPING_FROM = 5000 // cents, after the discount
export const SHIPPING_FEE = 499
const COUPONS = { SAVE10: 10 } // percent off

export const useCartStore = defineStore('cart', () => {
  const products = useProductsStore() // stores can use other stores

  // Store ids and quantities only: [{ productId, quantity }]
  const items = ref([])
  const couponCode = ref('')

  // TODO (step 3): lines (each item joined with its product + lineTotal), count, subtotal
  const lines = computed(() => [])
  const count = computed(() => 0)
  const subtotal = computed(() => 0)

  // TODO (step 5): discountPercent, discount, shipping, total
  const discountPercent = computed(() => 0)
  const discount = computed(() => 0)
  const shipping = computed(() => 0)
  const total = computed(() => 0)

  function quantityOf(productId) {
    return 0 // TODO (step 4)
  }

  function canAdd(productId) {
    return true // TODO (step 4): never more than the stock
  }

  function add(productId) {
    // TODO (step 3): increase the quantity when the product is already in the cart
    items.value.push({ productId, quantity: 1 })
  }

  function setQuantity(productId, quantity) {
    // TODO (step 4): clamp to 1..stock; 0 or less removes the line
  }

  function remove(productId) {
    // TODO (step 4)
  }

  function applyCoupon(code) {
    return false // TODO (step 5): normalise the code, check COUPONS, store it
  }

  function removeCoupon() {
    couponCode.value = ''
  }

  // Setup stores have no automatic $reset(), so we write our own.
  function clear() {
    items.value = []
    couponCode.value = ''
  }

  // TODO (step 6): save whenever items or couponCode change

${cartStoreReturn}`

const cartStoreJs = `import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useProductsStore } from './products.js'
import { loadCart, saveCart } from './cartStorage.js'

export const FREE_SHIPPING_FROM = 5000 // cents, after the discount
export const SHIPPING_FEE = 499
// SIMPLIFIED: real coupon rules live on the server, which re-checks them at checkout.
const COUPONS = { SAVE10: 10 } // percent off

export const useCartStore = defineStore('cart', () => {
  const products = useProductsStore() // stores can use other stores

  // ---- state (restored from storage; see cartStorage.js)
  const saved = loadCart(products.byId)
  // Store ids and quantities only: [{ productId, quantity }]
  const items = ref(saved.items)
  const couponCode = ref(Object.hasOwn(COUPONS, saved.couponCode) ? saved.couponCode : '')

  // ---- getters
  const lines = computed(() =>
    items.value.map((item) => {
      const product = products.byId(item.productId)
      return { product, quantity: item.quantity, lineTotal: product.price * item.quantity }
    }),
  )
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.lineTotal, 0))
  const discountPercent = computed(() => COUPONS[couponCode.value] ?? 0)
  // Rounded to whole cents. How to round is a business rule; the server decides.
  const discount = computed(() => Math.round((subtotal.value * discountPercent.value) / 100))
  const shipping = computed(() => {
    if (subtotal.value === 0) return 0
    return subtotal.value - discount.value >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
  })
  const total = computed(() => subtotal.value - discount.value + shipping.value)

  function quantityOf(productId) {
    return items.value.find((item) => item.productId === productId)?.quantity ?? 0
  }

  function canAdd(productId) {
    const product = products.byId(productId)
    return product !== null && quantityOf(productId) < product.stock
  }

  // ---- actions
  function add(productId) {
    if (!canAdd(productId)) return false
    const existing = items.value.find((item) => item.productId === productId)
    if (existing) existing.quantity++
    else items.value.push({ productId, quantity: 1 })
    return true
  }

  function setQuantity(productId, quantity) {
    const product = products.byId(productId)
    if (!product) return
    if (quantity <= 0) {
      remove(productId)
      return
    }
    const item = items.value.find((i) => i.productId === productId)
    if (item) item.quantity = Math.min(quantity, product.stock)
  }

  function remove(productId) {
    items.value = items.value.filter((item) => item.productId !== productId)
  }

  function applyCoupon(code) {
    const normalized = String(code).trim().toUpperCase()
    if (!Object.hasOwn(COUPONS, normalized)) return false
    couponCode.value = normalized
    return true
  }

  function removeCoupon() {
    couponCode.value = ''
  }

  // Setup stores have no automatic $reset(), so we write our own.
  function clear() {
    items.value = []
    couponCode.value = ''
  }

  // ---- persistence: save after every change (deep: quantity edits count too)
  watch([items, couponCode], () => saveCart({ items: items.value, couponCode: couponCode.value }), { deep: true })

${cartStoreReturn}`

const productListVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useProductsStore } from '../stores/products.js'
import ProductCard from './ProductCard.vue'

const products = useProductsStore()
// storeToRefs keeps state and getters reactive after destructuring.
const { visible, categories, category } = storeToRefs(products)

function labelFor(value) {
  return value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)
}
</script>

<template>
  <section class="catalog" aria-labelledby="catalog-heading">
    <h2 id="catalog-heading" class="visually-hidden">Products</h2>
    <div class="categories" role="group" aria-label="Filter by category">
      <button
        v-for="value in ['all', ...categories]"
        :key="value"
        type="button"
        :class="['category', 'category-' + value, { 'is-active': category === value }]"
        :aria-pressed="category === value"
        @click="products.setCategory(value)"
      >
        {{ labelFor(value) }}
      </button>
    </div>
    <div class="grid">
      <ProductCard v-for="product in visible" :key="product.id" :product="product" />
    </div>
  </section>
</template>

<style scoped>
.categories { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.category { padding: 6px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; }
.category.is-active { background: var(--ink); border-color: var(--ink); color: #fff; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
</style>`

const cardStyles = `<style scoped>
.product-card { display: grid; gap: 4px; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.thumb { display: grid; place-items: center; height: 90px; border-radius: 8px; font-size: 2rem; font-weight: 800; color: rgba(0, 0, 0, 0.35); }
.product-name { margin: 6px 0 0; font-size: 1rem; }
.price { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.stock { margin: 0; font-size: 0.85rem; color: var(--muted); }
.is-sold-out .stock { color: var(--danger); }
.add-to-cart { margin-top: 6px; padding: 8px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; }
</style>`

const starterCardVue = `<script setup>
import { computed } from 'vue'
import { formatCents } from '../money.js'
// TODO (step 3): import { useCartStore } from '../stores/cart.js'

const props = defineProps({
  product: { type: Object, required: true },
})

const soldOut = computed(() => props.product.stock === 0)
const stockNote = computed(() => {
  if (soldOut.value) return 'Out of stock'
  return props.product.stock <= 3 ? 'Only ' + props.product.stock + ' left' : 'In stock'
})
// TODO (step 4): how many are already in the cart? Is it at the stock limit?
const buttonLabel = computed(() => (soldOut.value ? 'Out of stock' : 'Add to cart'))
</script>

<template>
  <article class="product-card" :class="{ 'is-sold-out': soldOut }">
    <div class="thumb" :style="{ background: product.color }" aria-hidden="true">{{ product.name.charAt(0) }}</div>
    <h3 class="product-name">{{ product.name }}</h3>
    <p class="price">{{ formatCents(product.price) }}</p>
    <p class="stock">{{ stockNote }}</p>
    <!-- TODO (step 3): add the product to the cart store on click -->
    <button
      type="button"
      class="add-to-cart"
      :disabled="soldOut"
      :aria-label="buttonLabel + ': ' + product.name"
    >
      {{ buttonLabel }}
    </button>
  </article>
</template>

${cardStyles}`

const cardVue = `<script setup>
import { computed } from 'vue'
import { formatCents } from '../money.js'
import { useCartStore } from '../stores/cart.js'

const props = defineProps({
  product: { type: Object, required: true },
})

// A "connected" component: it talks to the store directly instead of
// asking every parent to pass cart data and callbacks down.
const cart = useCartStore()

const inCart = computed(() => cart.quantityOf(props.product.id))
const soldOut = computed(() => props.product.stock === 0)
const atMax = computed(() => !soldOut.value && inCart.value >= props.product.stock)
const stockNote = computed(() => {
  if (soldOut.value) return 'Out of stock'
  return props.product.stock <= 3 ? 'Only ' + props.product.stock + ' left' : 'In stock'
})
const buttonLabel = computed(() => {
  if (soldOut.value) return 'Out of stock'
  if (atMax.value) return 'Max in cart'
  return inCart.value ? 'Add another (' + inCart.value + ' in cart)' : 'Add to cart'
})
</script>

<template>
  <article class="product-card" :class="{ 'is-sold-out': soldOut }">
    <div class="thumb" :style="{ background: product.color }" aria-hidden="true">{{ product.name.charAt(0) }}</div>
    <h3 class="product-name">{{ product.name }}</h3>
    <p class="price">{{ formatCents(product.price) }}</p>
    <p class="stock">{{ stockNote }}</p>
    <button
      type="button"
      class="add-to-cart"
      :disabled="soldOut || atMax"
      :aria-label="buttonLabel + ': ' + product.name"
      @click="cart.add(product.id)"
    >
      {{ buttonLabel }}
    </button>
  </article>
</template>

${cardStyles}`

const cartLineVue = `<script setup>
import { formatCents } from '../money.js'

// A presentational component: data in through props, intent out through events.
// It knows nothing about Pinia, so it is trivial to reuse and test.
defineProps({
  line: { type: Object, required: true }, // { product, quantity, lineTotal }
})
const emit = defineEmits(['change-quantity', 'remove'])
</script>

<template>
  <li class="cart-line">
    <div class="line-info">
      <span class="line-name">{{ line.product.name }}</span>
      <span class="line-each">{{ formatCents(line.product.price) }} each</span>
    </div>
    <div class="qty" role="group" :aria-label="'Quantity of ' + line.product.name">
      <button
        type="button"
        class="qty-dec"
        :disabled="line.quantity <= 1"
        aria-label="Decrease quantity"
        @click="emit('change-quantity', line.product.id, line.quantity - 1)"
      >
        −
      </button>
      <span class="qty-value">{{ line.quantity }}</span>
      <button
        type="button"
        class="qty-inc"
        :disabled="line.quantity >= line.product.stock"
        aria-label="Increase quantity"
        @click="emit('change-quantity', line.product.id, line.quantity + 1)"
      >
        +
      </button>
    </div>
    <span class="line-total">{{ formatCents(line.lineTotal) }}</span>
    <button type="button" class="line-remove" :aria-label="'Remove ' + line.product.name" @click="emit('remove', line.product.id)">
      Remove
    </button>
  </li>
</template>

<style scoped>
.cart-line { display: grid; grid-template-columns: 1fr auto auto; gap: 4px 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.line-info { display: grid; }
.line-name { font-weight: 600; }
.line-each { font-size: 0.8rem; color: var(--muted); }
.qty { display: flex; align-items: center; gap: 6px; }
.qty button { width: 28px; height: 28px; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
.qty-value { min-width: 1.5em; text-align: center; font-variant-numeric: tabular-nums; }
.line-total { font-variant-numeric: tabular-nums; text-align: right; }
.line-remove { grid-column: 1 / -1; justify-self: start; border: 0; background: none; padding: 0; color: var(--danger); text-decoration: underline; font-size: 0.85rem; }
</style>`

const panelStyles = `<style scoped>
.cart-panel { position: sticky; top: 12px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft); }
.cart-panel h2 { margin: 0 0 8px; font-size: 1.2rem; }
.muted { color: var(--muted); font-weight: 400; }
.cart-empty { color: var(--muted); }
.cart-lines { list-style: none; margin: 0; padding: 0; }
.coupon-form { margin-top: 12px; }
.coupon-form label { font-size: 0.85rem; font-weight: 600; }
.coupon-row { display: flex; gap: 6px; margin-top: 4px; }
.coupon-input { flex: 1; min-width: 0; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; text-transform: uppercase; }
.coupon-apply { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; }
.coupon-message { margin: 6px 0 0; font-size: 0.85rem; }
.coupon-message.is-ok { color: var(--ok); }
.coupon-message.is-error { color: var(--danger); }
.totals { margin: 14px 0 0; display: grid; gap: 4px; }
.totals div { display: flex; justify-content: space-between; }
.totals dt { color: var(--muted); }
.totals dd { margin: 0; font-variant-numeric: tabular-nums; }
.totals .grand { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--line); font-weight: 800; }
.totals .grand dt { color: var(--ink); }
.shipping-hint { margin: 8px 0 0; font-size: 0.85rem; color: var(--muted); }
.clear-cart { margin-top: 12px; border: 0; background: none; padding: 0; color: var(--danger); text-decoration: underline; }
</style>`

const panelTemplate = `<template>
  <aside id="cart" class="cart-panel" aria-labelledby="cart-heading">
    <h2 id="cart-heading">Your cart <span class="muted">({{ count }})</span></h2>

    <p v-if="lines.length === 0" class="cart-empty">Your cart is empty. Add something lovely.</p>

    <template v-else>
      <ul class="cart-lines">
        <CartLine
          v-for="line in lines"
          :key="line.product.id"
          :line="line"
          @change-quantity="cart.setQuantity"
          @remove="cart.remove"
        />
      </ul>

      <form class="coupon-form" @submit.prevent="submitCoupon">
        <label for="coupon">Coupon code</label>
        <div class="coupon-row">
          <input id="coupon" v-model="couponInput" class="coupon-input" autocomplete="off" />
          <button type="submit" class="coupon-apply">Apply</button>
        </div>
        <p v-if="couponMessage" class="coupon-message" :class="couponOk ? 'is-ok' : 'is-error'" role="status">
          {{ couponMessage }}
        </p>
      </form>

      <dl class="totals">
        <div><dt>Subtotal</dt><dd class="subtotal">{{ formatCents(subtotal) }}</dd></div>
        <div v-if="discount > 0"><dt>Discount ({{ couponCode }})</dt><dd class="discount">{{ formatCents(-discount) }}</dd></div>
        <div><dt>Shipping</dt><dd class="shipping">{{ shipping === 0 ? 'Free' : formatCents(shipping) }}</dd></div>
        <div class="grand"><dt>Total</dt><dd class="total">{{ formatCents(total) }}</dd></div>
      </dl>
      <p v-if="shipping > 0" class="shipping-hint">
        Add {{ formatCents(FREE_SHIPPING_FROM - (subtotal - discount)) }} more for free shipping.
      </p>

      <button type="button" class="clear-cart" @click="cart.clear()">Empty cart</button>
    </template>
  </aside>
</template>`

const starterPanelVue = `<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore, FREE_SHIPPING_FROM } from '../stores/cart.js'
import CartLine from './CartLine.vue'
import { formatCents } from '../money.js'

const cart = useCartStore()
// State and getters: destructure through storeToRefs to keep them reactive.
// Actions (cart.add, cart.remove, …) are plain functions: call them on the store.
const { lines, count, subtotal, discount, shipping, total, couponCode } = storeToRefs(cart)

const couponInput = ref('')
const couponMessage = ref('')
const couponOk = ref(false)

function submitCoupon() {
  // TODO (step 5): call cart.applyCoupon(), then show a success or error message
}
</script>

${panelTemplate}

${panelStyles}`

const panelVue = `<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore, FREE_SHIPPING_FROM } from '../stores/cart.js'
import CartLine from './CartLine.vue'
import { formatCents } from '../money.js'

const cart = useCartStore()
// State and getters: destructure through storeToRefs to keep them reactive.
// Actions (cart.add, cart.remove, …) are plain functions: call them on the store.
const { lines, count, subtotal, discount, shipping, total, couponCode } = storeToRefs(cart)

const couponInput = ref('')
const couponMessage = ref('')
const couponOk = ref(false)

function submitCoupon() {
  const typed = couponInput.value.trim()
  couponOk.value = cart.applyCoupon(typed)
  if (couponOk.value) {
    couponMessage.value = 'Coupon ' + cart.couponCode + ' applied: ' + cart.discountPercent + '% off.'
    couponInput.value = ''
  } else {
    couponMessage.value = '“' + typed + '” is not a valid code.'
  }
}
</script>

${panelTemplate}

${panelStyles}`

const appStyles = `<style scoped>
.shop-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.shop-header h1 { margin: 0; font-size: 1.5rem; }
.cart-link { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border: 1px solid var(--ink); border-radius: 99px; color: var(--ink); text-decoration: none; }
.cart-count { display: inline-grid; place-items: center; min-width: 1.6em; height: 1.6em; padding: 0 4px; border-radius: 99px; background: var(--ink); color: #fff; font-size: 0.85rem; font-variant-numeric: tabular-nums; }
.layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
@media (max-width: 760px) { .layout { grid-template-columns: 1fr; } }
</style>`

const starterAppVue = `<script setup>
import ProductList from './components/ProductList.vue'
import CartPanel from './components/CartPanel.vue'
// TODO (step 3): read the cart count from the cart store for the header badge
</script>

<template>
  <div class="shop">
    <header class="shop-header">
      <h1>Corner Shop</h1>
      <a href="#cart" class="cart-link" aria-label="Cart, 0 items">
        Cart <span class="cart-count">0</span>
      </a>
    </header>

    <div class="layout">
      <ProductList />
      <CartPanel />
    </div>
  </div>
</template>

${appStyles}`

const appVue = `<script setup>
import { storeToRefs } from 'pinia'
import ProductList from './components/ProductList.vue'
import CartPanel from './components/CartPanel.vue'
import { useCartStore } from './stores/cart.js'

// The header, the product cards and the cart panel all read the SAME store.
// The header only needs the item count, so take just that (still reactive).
const { count } = storeToRefs(useCartStore())
</script>

<template>
  <div class="shop">
    <header class="shop-header">
      <h1>Corner Shop</h1>
      <a href="#cart" class="cart-link" :aria-label="'Cart, ' + count + (count === 1 ? ' item' : ' items')">
        Cart <span class="cart-count">{{ count }}</span>
      </a>
    </header>

    <div class="layout">
      <ProductList />
      <CartPanel />
    </div>
  </div>
</template>

${appStyles}`

// ---------------------------------------------------------------- interview coding question

const wishlistStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref([])

  function toggle(id) {
    ids.value.push(id)
  }

  return { ids, toggle }
})
`

const wishlistSolution = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const ids = ref([])

  const count = computed(() => ids.value.length)

  function has(id) {
    return ids.value.includes(id)
  }

  function toggle(id) {
    if (has(id)) ids.value = ids.value.filter((existing) => existing !== id)
    else ids.value.push(id)
  }

  function clear() {
    ids.value = []
  }

  return { ids, count, has, toggle, clear }
})
`

const wishlistApp = `<script setup>
// The tests use the store directly with a fresh Pinia.
</script>

<template>
  <p>Implement stores/wishlist.js</p>
</template>`

const freshPinia = `const { createPinia, setActivePinia } = requireModule('pinia')
setActivePinia(createPinia())
const { useWishlistStore } = requireModule('stores/wishlist.js')
const wishlist = useWishlistStore()`

const findCard = (name) => `findAll('.product-card').find((card) => card.textContent.includes('${name}'))`

export default {
  id: 'project-ecommerce-cart',
  kind: 'project',
  title: 'Project 5: E-commerce Cart',
  summary: 'Build a small shop where product cards, a header badge and a cart panel share one Pinia store — with stock limits, coupons, shipping rules and a cart that survives reloads.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['why-state-management', 'pinia-basics', 'using-stores', 'computed', 'project-task-manager'],
  related: ['pinia-production', 'pinia-async-patterns', 'component-communication', 'project-expense-tracker', 'project-admin-dashboard', 'auth-security'],
  tags: ['project', 'pinia', 'store', 'shopping cart', 'shared state', 'storeToRefs', 'getters', 'actions', 'persistence', 'e-commerce'],
  apis: [
    { name: 'defineStore()', summary: 'Pinia: defines a store. With a setup function, refs are state, computeds are getters and functions are actions.' },
    { name: 'storeToRefs()', summary: 'Pinia: destructures state and getters from a store without losing reactivity.' },
    { name: 'createPinia()', summary: 'Pinia: creates the root store container you install with app.use().' },
    { name: 'setActivePinia()', summary: 'Pinia: sets the active Pinia — used to test stores without mounting an app.' },
  ],
  docs: [
    { label: 'Pinia — Defining a Store (setup stores)', url: 'https://pinia.vuejs.org/core-concepts/' },
    { label: 'Pinia — Getters', url: 'https://pinia.vuejs.org/core-concepts/getters.html' },
    { label: 'Pinia — Actions', url: 'https://pinia.vuejs.org/core-concepts/actions.html' },
    { label: 'Pinia — State: subscribing to the state', url: 'https://pinia.vuejs.org/core-concepts/state.html#Subscribing-to-the-state' },
    { label: 'Vue Guide — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html' },
  ],

  intro: `
*Corner Shop* is a tiny online store: a product grid, a cart badge in the header and a cart panel with quantities, a coupon box and totals.

Three components that sit far apart in the tree all need **the same cart**:

- each **product card** needs to know how many of *its* product are in the cart (and whether you've hit the stock limit),
- the **header badge** needs the total item count,
- the **cart panel** needs everything: lines, totals, coupon, shipping.

Passing the cart down through props and bubbling every change up through events would work — and would be miserable. This project uses **Pinia**, Vue's official state management library, to put the cart in one shared *store* that any component can read and change through well-named *actions*.
`,

  why: `
In Project 2, \`App.vue\` owned the tasks and passed them down. That is the right default — until the components that share data are far apart. Then every component in between has to accept props it doesn't use and re-emit events it doesn't care about ("prop drilling").

A **store** is a piece of state that lives outside any component, with three parts:

- **state** — the data itself (cart items, coupon code),
- **getters** — values derived from it (count, subtotal, total),
- **actions** — the only functions that change it (add, remove, apply coupon).

Any component can use the store directly, and because all changes go through actions, rules like "never more than the stock" live in exactly one place. Pinia also gives you Vue Devtools integration, so you can see every action and state change.

And because shopping carts are about money, this project also shows the boundary every shop must respect: **the browser can calculate totals for display, but only the server decides what the customer pays.**
`,

  eli15: `
Think of a family shopping list on the fridge. Anyone can walk up and read it, and anyone can add "milk" — but there are house rules: write clearly, don't add something twice, no more than we can carry.

A Pinia **store** is that fridge list for your app. Product cards, the header and the cart panel don't keep their own copies; they all look at the same list. When a card says "add a mug", it doesn't scribble on the list itself — it calls an **action** (\`cart.add('p1')\`) that follows the house rules ("only 5 mugs in stock").

The totals at the bottom of the list ("12 items, $86") are never written down by hand. They're **getters**: worked out from the list every time it changes.

And when you leave the house, someone snaps a photo of the list (localStorage), so it's still there when you get back.
`,

  analogy: {
    title: 'The shop\'s single stock ledger',
    body: `
A real shop has one ledger behind the counter. The till, the website and the staff on the floor all check the *same* ledger before promising a customer anything. Nobody keeps a private notebook, because notebooks disagree.

Changes go through a clerk who enforces the rules — you can't sell more mugs than there are on the shelf. Totals like "items sold today" are added up from the ledger, not tracked separately.
`,
    mapping: [
      ['the ledger behind the counter', 'the Pinia store (`useCartStore`)'],
      ['the clerk who records sales by the rules', 'actions: `add`, `setQuantity`, `remove`, `applyCoupon`'],
      ['"items sold today" added up from the ledger', 'getters: `count`, `subtotal`, `total`'],
      ['till, website and floor staff reading the same ledger', 'header badge, product cards and cart panel using one store'],
      ['a photo of the ledger at closing time', 'saving the cart to `localStorage`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Three components, one store',
    caption: 'Components call actions; actions change state; getters recompute; every component that reads them updates. A watcher saves the cart.',
    alt: 'Diagram: ProductCard, the header badge in App and CartPanel all connect to the cart store. ProductCard calls add(); CartPanel calls setQuantity, remove and applyCoupon, passing data to the presentational CartLine through props. The cart store holds items and couponCode as state, derives lines, count, subtotal, discount, shipping and total as getters, reads product data from the products store, and saves to localStorage through cartStorage.js.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'card', label: 'ProductCard', note: 'cart.add(id) · cart.quantityOf(id)', tone: 'paper' },
        { id: 'header', label: 'Header badge (App)', note: 'cart.count', tone: 'paper' },
        { id: 'panel', label: 'CartPanel → CartLine', note: 'storeToRefs · setQuantity · remove · applyCoupon', tone: 'paper' },
        { id: 'products', label: 'products store', note: 'catalogue · category · byId()', tone: 'cobalt' },
        { id: 'cart', label: 'cart store', note: 'items · couponCode → lines · count · total', tone: 'acid' },
        { id: 'storage', label: 'cartStorage.js', note: 'ids + quantities → localStorage', tone: 'kraft' },
      ],
      edges: [
        { from: 'card', to: 'cart', label: 'add()' },
        { from: 'panel', to: 'cart', label: 'actions' },
        { from: 'cart', to: 'header', label: 'count', dashed: true },
        { from: 'products', to: 'cart', label: 'prices · stock' },
        { from: 'cart', to: 'storage', label: 'watch → save' },
      ],
      steps: [
        { focus: ['card', 'cart'], edges: ['card->cart'], text: 'A product card calls the `add(id)` action. The action checks the stock rule and updates `items` — the only place that rule lives.' },
        { focus: ['products', 'cart'], edges: ['products->cart'], text: 'The cart stores only ids and quantities. Prices, names and stock come from the products store — one store can use another.' },
        { focus: ['cart', 'header', 'panel'], edges: ['cart->header'], text: 'Getters (`count`, `subtotal`, `total`…) recompute, and every component that reads them re-renders: the badge, the card button label and the panel.' },
        { focus: ['cart', 'storage'], edges: ['cart->storage'], text: 'A deep watcher inside the store saves `{ items, couponCode }` after each change. On start, the store restores them — dropping unknown products and clamping to current stock.' },
      ],
    },
  },

  animation: {
    type: 'pinia',
    props: { preset: 'cart' },
    title: 'Who re-renders when the cart changes?',
    caption: 'Several components share one real store. Trigger an action and watch which components update.',
    alt: 'An interactive demo with several components connected to one Pinia cart store. Triggering an action such as adding an item updates the store state, and the components that read the changed state or getters are highlighted as they re-render.',
  },

  requirements: [
    '`main.js` installs Pinia: `createApp(App).use(createPinia()).mount(\'#app\')`.',
    'Show 8 products as `.product-card`s (name, `.price`, `.stock`). Category buttons `.category-all`, `.category-kitchen`, `.category-stationery`, `.category-home` filter the grid (state in `stores/products.js`).',
    'Each card\'s `.add-to-cart` button adds the product via the cart store\'s `add(id)` action. Adding a product that is already in the cart increases its quantity (one line per product). The button reads **Out of stock** (disabled) when stock is 0 and **Max in cart** (disabled) at the stock limit.',
    'The header badge `.cart-count` always shows the total number of items.',
    '`CartPanel` lists `.cart-line`s with `.qty-dec`, `.qty-value`, `.qty-inc` (never below 1 or above stock — the **action** enforces it) and `.line-remove`. An empty cart shows `.cart-empty`.',
    'Totals: `.subtotal`, `.shipping` (**$4.99**, or **Free** when subtotal minus discount is at least **$50.00**), `.total`, and `.discount` (shown as e.g. **-$6.40**) when a coupon is applied.',
    'A `.coupon-form` with `.coupon-input` accepts the code **SAVE10** (case-insensitive, 10% off). Invalid codes show a message in `.coupon-message`.',
    '`stores/cart.js` exports `useCartStore`. The cart (`{ items: [{ productId, quantity }], couponCode }`) is saved to `localStorage` under `CART_KEY` from `stores/cartStorage.js` after every change, and restored on start — unknown products dropped, quantities clamped to current stock.',
  ],

  objectives: [
    'Decide when state belongs in a store instead of a component, and install Pinia.',
    'Write setup stores with state (refs), getters (computed) and actions (functions) — including a store that uses another store.',
    'Use stores from components correctly: call actions on the store, destructure state and getters with `storeToRefs()`.',
    'Model money and business rules (stock limits, coupons, shipping thresholds) as derived values and guarded actions.',
    'Persist store state safely, and explain why the server must re-validate everything at checkout.',
  ],

  playground: {
    title: 'Corner Shop — starter',
    objective: 'Pinia is installed and the components exist, but the cart store is a stub. Make the store real, connect the components and persist the cart until every test passes.',
    files: {
      'main.js': mainJs,
      'App.vue': starterAppVue,
      'stores/products.js': productsStoreJs,
      'stores/cart.js': starterCartStoreJs,
      'stores/cartStorage.js': cartStorageJs,
      'components/ProductList.vue': productListVue,
      'components/ProductCard.vue': starterCardVue,
      'components/CartPanel.vue': starterPanelVue,
      'components/CartLine.vue': cartLineVue,
      'money.js': moneyJs,
      'styles.css': stylesCss,
    },
    expected: 'The starter shows the catalogue and category filters, but adding to the cart does nothing visible, the badge says 0 and the cart is always empty. `localStorage` here is in-memory and resets on every run; the tests check that the store writes and reads it correctly.',
    tests: [
      {
        name: 'lists the products; sold-out items cannot be added',
        code: `expect(findAll('.product-card')).toHaveLength(8)
expect(text('.catalog')).toContain('$14.00')
const lamp = ${findCard('Desk lamp')}
expect(lamp.querySelector('.add-to-cart').disabled).toBe(true)
expect(lamp.querySelector('.add-to-cart').textContent.trim()).toBe('Out of stock')`,
      },
      {
        name: 'Add to cart updates the badge and the cart panel',
        code: `try {
  await click(${findCard('Ceramic mug')}.querySelector('.add-to-cart'))
  expect(text('.cart-count')).toBe('1')
  expect(findAll('.cart-line')).toHaveLength(1)
  expect(text('.cart-panel')).toContain('Ceramic mug')
  expect(text('.subtotal')).toBe('$14.00')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'adding the same product again increases its quantity',
        code: `try {
  const button = ${findCard('Ceramic mug')}.querySelector('.add-to-cart')
  await click(button)
  await click(button)
  expect(findAll('.cart-line')).toHaveLength(1)
  expect(text('.qty-value')).toBe('2')
  expect(text('.cart-count')).toBe('2')
  expect(text('.subtotal')).toBe('$28.00')
  expect(button.textContent).toContain('2 in cart')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'quantities never exceed stock (the action enforces it)',
        code: `try {
  const button = ${findCard('Cast-iron pan')}.querySelector('.add-to-cart')
  await click(button)
  await click(button)
  expect(text('.qty-value')).toBe('2')
  expect(button.disabled).toBe(true)
  expect(button.textContent.trim()).toBe('Max in cart')
  // force a third click anyway: the store action must refuse it
  button.disabled = false
  await click(button)
  expect(text('.qty-value')).toBe('2')
  find('.qty-inc').disabled = false
  await click('.qty-inc')
  expect(text('.qty-value')).toBe('2')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'quantity buttons and remove work; an empty cart says so',
        code: `try {
  await click(${findCard('Ceramic mug')}.querySelector('.add-to-cart'))
  await click('.qty-inc')
  expect(text('.qty-value')).toBe('2')
  await click('.qty-dec')
  expect(text('.qty-value')).toBe('1')
  expect(find('.qty-dec').disabled).toBe(true)
  await click('.line-remove')
  expect(exists('.cart-line')).toBe(false)
  expect(exists('.cart-empty')).toBe(true)
  expect(text('.cart-count')).toBe('0')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'shipping is $4.99, and free from $50',
        code: `try {
  await click(${findCard('Ceramic mug')}.querySelector('.add-to-cart'))
  expect(text('.shipping')).toBe('$4.99')
  expect(text('.total')).toBe('$18.99')
  await click(${findCard('Wool throw')}.querySelector('.add-to-cart'))
  expect(text('.subtotal')).toBe('$78.00')
  expect(text('.shipping')).toBe('Free')
  expect(text('.total')).toBe('$78.00')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'SAVE10 takes 10% off; invalid codes show a message',
        code: `try {
  await click(${findCard('Wool throw')}.querySelector('.add-to-cart'))
  await type('.coupon-input', 'bogus')
  await submit('.coupon-form')
  expect(text('.coupon-message')).toContain('not a valid code')
  expect(exists('.discount')).toBe(false)
  await type('.coupon-input', ' save10 ')
  await submit('.coupon-form')
  expect(text('.discount')).toBe('-$6.40')
  expect(text('.total')).toBe('$57.60')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'a discount can bring the order back under the free-shipping threshold',
        code: `try {
  await click(${findCard('Cast-iron pan')}.querySelector('.add-to-cart'))
  await click(${findCard('A5 notebook')}.querySelector('.add-to-cart'))
  expect(text('.shipping')).toBe('Free')
  await type('.coupon-input', 'SAVE10')
  await submit('.coupon-form')
  expect(text('.discount')).toBe('-$5.25')
  expect(text('.shipping')).toBe('$4.99')
  expect(text('.total')).toBe('$52.24')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'the store is the single source of truth',
        code: `try {
  const { useCartStore } = requireModule('stores/cart.js')
  const cart = useCartStore()
  cart.add('p5')
  cart.add('p5')
  await nextTick()
  expect(text('.cart-count')).toBe('2')
  expect(text('.cart-panel')).toContain('Fountain pen')
  expect(cart.count).toBe(2)
  expect(cart.subtotal).toBe(6400)
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'the cart is saved to localStorage after every change',
        code: `const { CART_KEY } = requireModule('stores/cartStorage.js')
try {
  await click(${findCard('Ceramic mug')}.querySelector('.add-to-cart'))
  let saved = JSON.parse(localStorage.getItem(CART_KEY))
  expect(saved.items).toEqual([{ productId: 'p1', quantity: 1 }])
  await click('.qty-inc')
  saved = JSON.parse(localStorage.getItem(CART_KEY))
  expect(saved.items[0].quantity).toBe(2)
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'a saved cart is restored, cleaned and clamped to current stock',
        code: `const { CART_KEY } = requireModule('stores/cartStorage.js')
const { createPinia, setActivePinia } = requireModule('pinia')
try {
  localStorage.setItem(CART_KEY, JSON.stringify({
    items: [
      { productId: 'p3', quantity: 5 },
      { productId: 'gone', quantity: 1 },
      { productId: 'p6', quantity: 1 },
    ],
    couponCode: 'SAVE10',
  }))
  setActivePinia(createPinia()) // a fresh Pinia = a brand-new cart store, as after a reload
  const shop = mountFile('App.vue')
  expect(shop.find('.cart-count').textContent).toBe('2')
  expect(shop.find('.cart-panel').textContent).toContain('Cast-iron pan')
  expect(shop.find('.cart-panel').textContent).not.toContain('Desk lamp')
  expect(shop.find('.discount').textContent).toBe('-$9.00')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'category buttons filter the catalogue',
        code: `await click('.category-stationery')
expect(findAll('.product-card')).toHaveLength(2)
expect(attr('.category-stationery', 'aria-pressed')).toBe('true')
await click('.category-all')
expect(findAll('.product-card')).toHaveLength(8)`,
      },
    ],
  },

  steps: [
    {
      title: 'Decide what is shared, and install Pinia',
      body: [
        `
List who needs the cart: the product cards (how many of *this* product are in it?), the header (how many items in total?) and the cart panel (everything). They live in different branches of the component tree, so there is no natural parent that owns the data without drilling props through components that don't care.

That is the signal for a store ([why shared state](lesson:why-state-management)). Install Pinia once, in \`main.js\`:
`,
        {
          code: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles.css'

createApp(App).use(createPinia()).mount('#app')`,
          lang: 'js',
          title: 'main.js',
        },
        {
          callout: 'note',
          title: 'Not everything goes in a store',
          text: 'The coupon *input text* and its message stay local to `CartPanel`; whether a card is hovered stays in the card. Only state that several distant components share — or that must outlive a component — belongs in a store.',
        },
      ],
    },
    {
      title: 'Read the products store',
      body: [
        `
\`stores/products.js\` is already written. It is a **setup store**: \`defineStore(id, setupFn)\` where the function body works like \`<script setup>\` ([Pinia basics](lesson:pinia-basics)):

- \`ref()\`s become **state** (\`all\`, \`category\`),
- \`computed()\`s become **getters** (\`categories\`, \`visible\`),
- functions become **actions** (\`setCategory\`, plus the \`byId\` helper).
`,
        {
          code: `export const useProductsStore = defineStore('products', () => {
  const all = ref(PRODUCTS.map((product) => ({ ...product })))
  const category = ref('all')

  const categories = computed(() => [...new Set(all.value.map((product) => product.category))])
  const visible = computed(() =>
    category.value === 'all' ? all.value : all.value.filter((product) => product.category === category.value),
  )

  function byId(id) {
    return all.value.find((product) => product.id === id) ?? null
  }

  function setCategory(value) {
    category.value = value
  }

  return { all, category, categories, visible, byId, setCategory }
})`,
          lang: 'js',
          title: 'stores/products.js',
        },
        `
Look at how \`ProductList.vue\` uses it: \`const { visible, categories, category } = storeToRefs(products)\`. A store is a reactive object; destructuring it directly would copy plain values and lose reactivity. \`storeToRefs()\` turns each piece of state and each getter into a ref, while actions are simply called on the store: \`products.setCategory(value)\` ([using stores](lesson:using-stores)).
`,
        {
          code: `// The same store written as an "options store", for comparison
export const useProductsStore = defineStore('products', {
  state: () => ({ all: PRODUCTS.map((p) => ({ ...p })), category: 'all' }),
  getters: {
    categories: (state) => [...new Set(state.all.map((p) => p.category))],
    visible: (state) => (state.category === 'all' ? state.all : state.all.filter((p) => p.category === state.category)),
  },
  actions: {
    setCategory(value) {
      this.category = value
    },
  },
})`,
          lang: 'js',
          title: 'options-store equivalent (not used here)',
          static: true,
        },
      ],
    },
    {
      title: 'The cart store: ids in state, everything else derived',
      body: [
        `
The most important design decision: the cart stores **only ids and quantities**, never copies of products.

\`\`\`js
items: [{ productId: 'p1', quantity: 2 }]
\`\`\`

If the cart stored \`{ name, price }\`, a price change in the catalogue would leave stale prices in the cart. Instead, a getter joins each item with the current product:
`,
        {
          code: `const products = useProductsStore() // stores can use other stores

const items = ref([])
const couponCode = ref('')

const lines = computed(() =>
  items.value.map((item) => {
    const product = products.byId(item.productId)
    return { product, quantity: item.quantity, lineTotal: product.price * item.quantity }
  }),
)
const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.lineTotal, 0))`,
          lang: 'js',
          title: 'stores/cart.js',
        },
        `
Then the \`add\` action — one line per product:
`,
        {
          code: `function add(productId) {
  if (!canAdd(productId)) return false
  const existing = items.value.find((item) => item.productId === productId)
  if (existing) existing.quantity++
  else items.value.push({ productId, quantity: 1 })
  return true
}`,
          lang: 'js',
        },
        `
Connect the components. \`ProductCard\` calls the store directly — no props or events needed to reach the cart:
`,
        {
          code: `import { useCartStore } from '../stores/cart.js'

const cart = useCartStore()
const inCart = computed(() => cart.quantityOf(props.product.id))`,
          lang: 'js',
          title: 'components/ProductCard.vue',
        },
        `
…with \`@click="cart.add(product.id)"\` on the button. In \`App.vue\`, the header only needs the count, so it takes just that: \`const { count } = storeToRefs(useCartStore())\`, then \`{{ count }}\` in the badge. Reading through the store object (\`cart.count\`) is reactive too — it's only *plain destructuring* (\`const { count } = cart\`) that breaks the connection.
`,
      ],
    },
    {
      title: 'Stock limits and quantity controls',
      body: [
        `
Rules live in actions, so no component can break them — not a forced click, not a future feature, not a test:
`,
        {
          code: `function quantityOf(productId) {
  return items.value.find((item) => item.productId === productId)?.quantity ?? 0
}

function canAdd(productId) {
  const product = products.byId(productId)
  return product !== null && quantityOf(productId) < product.stock
}

function setQuantity(productId, quantity) {
  const product = products.byId(productId)
  if (!product) return
  if (quantity <= 0) {
    remove(productId)
    return
  }
  const item = items.value.find((i) => i.productId === productId)
  if (item) item.quantity = Math.min(quantity, product.stock)
}

function remove(productId) {
  items.value = items.value.filter((item) => item.productId !== productId)
}`,
          lang: 'js',
          title: 'stores/cart.js',
        },
        `
The card's button label and disabled state are *derived* from \`quantityOf\` and the stock (\`Add to cart\` → \`Add another (2 in cart)\` → \`Max in cart\`).

Notice the two styles of component in the cart panel:

- \`CartPanel\` is a **container**: it uses the store and wires things together.
- \`CartLine\` is **presentational**: it takes a \`line\` prop and emits \`change-quantity\` / \`remove\`, knowing nothing about Pinia. The panel connects them: \`@change-quantity="cart.setQuantity" @remove="cart.remove"\`.

Presentational components are easier to reuse and test; connected ones avoid prop drilling. Use both on purpose ([component communication](lesson:component-communication)).
`,
      ],
    },
    {
      title: 'Coupons, discount, shipping and total',
      body: [
        `
Each money rule is one getter, and they build on each other:
`,
        {
          code: `const COUPONS = { SAVE10: 10 } // percent off — SIMPLIFIED

const discountPercent = computed(() => COUPONS[couponCode.value] ?? 0)
const discount = computed(() => Math.round((subtotal.value * discountPercent.value) / 100))
const shipping = computed(() => {
  if (subtotal.value === 0) return 0
  return subtotal.value - discount.value >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
})
const total = computed(() => subtotal.value - discount.value + shipping.value)

function applyCoupon(code) {
  const normalized = String(code).trim().toUpperCase()
  if (!Object.hasOwn(COUPONS, normalized)) return false
  couponCode.value = normalized
  return true
}`,
          lang: 'js',
          title: 'stores/cart.js',
        },
        `
Because they are getters, an interesting case falls out for free: a $52.50 order ships free, but applying SAVE10 brings it to $47.25 — under the threshold — so shipping returns. No handler had to remember that.

\`Object.hasOwn\` (rather than \`code in COUPONS\`) avoids matching inherited properties of plain objects. In \`CartPanel\`, \`submitCoupon()\` calls \`cart.applyCoupon(...)\` and shows a message based on the boolean it returns.
`,
        {
          callout: 'warn',
          title: 'The browser is not the cash register',
          text: 'Everything here is for display. Anyone can open devtools and change prices, quantities or coupons in the client. At checkout, send only product ids, quantities and the coupon code; the server must look up real prices and stock, validate the coupon and compute the amount to charge. See [auth & security](lesson:auth-security).',
        },
      ],
    },
    {
      title: 'Persist the cart',
      body: [
        `
\`stores/cartStorage.js\` (provided) saves \`{ items, couponCode }\` and, on load, validates the data, drops products that no longer exist and **clamps quantities to the current stock** — the saved cart might be days old. Wire it into the store: restore when the store is created, save on every change.
`,
        {
          code: `import { loadCart, saveCart } from './cartStorage.js'

// inside defineStore('cart', () => { … })
const saved = loadCart(products.byId)
const items = ref(saved.items)
const couponCode = ref(Object.hasOwn(COUPONS, saved.couponCode) ? saved.couponCode : '')

// …getters and actions…

watch([items, couponCode], () => saveCart({ items: items.value, couponCode: couponCode.value }), { deep: true })`,
          lang: 'js',
          title: 'stores/cart.js',
        },
        `
Setup stores can use \`watch\` like any composable; Pinia runs the store's setup inside its own effect scope, so the watcher lives as long as the store. \`deep: true\` catches quantity changes inside the array.

Two alternatives you will meet ([Pinia in production](lesson:pinia-production)):
`,
        {
          code: `// 1. Subscribe from outside the store (e.g. in main.js after app.use(pinia))
const cart = useCartStore()
cart.$subscribe((mutation, state) => {
  saveCart({ items: state.items, couponCode: state.couponCode })
})

// 2. A Pinia plugin that adds persistence to any store that opts in
pinia.use(({ store }) => {
  if (store.$id === 'cart') {
    store.$subscribe((mutation, state) => saveCart({ items: state.items, couponCode: state.couponCode }))
  }
})`,
          lang: 'js',
          title: 'other ways to persist (not used here)',
          static: true,
        },
        {
          callout: 'note',
          title: 'Sandbox note',
          text: '`localStorage` in this playground is an in-memory stand-in that resets on every run. The restore test simulates a reload by creating a fresh Pinia (`setActivePinia(createPinia())`), which creates a brand-new cart store that reads storage again.',
        },
      ],
    },
    {
      title: 'Review: test the store without the UI',
      body: [
        `
One of Pinia's best features is that stores are plain functions you can test directly — no mounting required ([testing stores](lesson:testing-logic)):
`,
        {
          code: `import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useCartStore } from '../src/stores/cart.js'

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia()) // a fresh, isolated store for every test
  })

  it('never exceeds stock', () => {
    const cart = useCartStore()
    cart.add('p3')
    cart.add('p3')
    expect(cart.add('p3')).toBe(false) // only 2 in stock
    expect(cart.count).toBe(2)
  })
})`,
          lang: 'js',
          title: 'cart.spec.js (Vitest, outside this sandbox)',
          static: true,
        },
        `
Run the playground tests until they are all green. Then open Vue Devtools in a real project: the Pinia tab shows every store, its state and getters, and a timeline of actions — invaluable when "the badge says 3 but the panel says 2".
`,
      ],
    },
  ],

  solution: {
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'stores/products.js': productsStoreJs,
      'stores/cart.js': cartStoreJs,
      'stores/cartStorage.js': cartStorageJs,
      'components/ProductList.vue': productListVue,
      'components/ProductCard.vue': cardVue,
      'components/CartPanel.vue': panelVue,
      'components/CartLine.vue': cartLineVue,
      'money.js': moneyJs,
      'styles.css': stylesCss,
    },
    explanation: `
**One store, many readers.** \`useCartStore\` holds \`items\` and \`couponCode\`. The header badge, every product card and the cart panel read it directly, so they can never disagree — and no component in between had to pass anything along.

**Minimal state, rich getters.** The cart stores ids and quantities only. \`lines\`, \`count\`, \`subtotal\`, \`discount\`, \`shipping\` and \`total\` are getters chained from that state and from the products store, so price changes, coupons and the free-shipping threshold all compose automatically.

**Rules in actions.** \`add\` and \`setQuantity\` enforce the stock limit; \`applyCoupon\` normalises and validates codes. Buttons are disabled for usability, but forcing a click still cannot break the rules.

**Containers and presentational components.** \`ProductCard\` and \`CartPanel\` talk to stores; \`CartLine\` is a pure props-and-events component the panel connects to store actions.

**Persistence with validation.** The store restores from \`localStorage\` on creation (dropping unknown products, clamping to current stock, ignoring unknown coupons) and saves through a deep watcher.

**Simplified on purpose:** the catalogue is static, coupons and shipping rules are hard-coded, and nothing is charged. In production the server is the source of truth for prices, stock, coupons and the final amount.
`,
  },

  challenges: [
    'Load the catalogue from a fake `api.js` with a loading state, using an async action in the products store — see [async actions](lesson:pinia-async-patterns).',
    'Add a mini cart in the header that opens a popover listing the lines (reuse `CartLine`).',
    'Show a toast "Added Ceramic mug" after each add, from a small `useToasts` store.',
    'Add a second coupon type, e.g. `FREESHIP`, without adding `if` statements to every getter (hint: describe coupons as data).',
    'Sync the cart between browser tabs with the `storage` event.',
    'Write a checkout step that sends `{ items, couponCode }` to a fake `api.js`, which recomputes the total itself and rejects if a price changed.',
  ],

  mistakes: [
    {
      title: 'Destructuring a store without storeToRefs',
      wrong: { lang: 'js', code: `const cart = useCartStore()\nconst { count, subtotal } = cart // plain values: they never update` },
      right: { lang: 'js', code: `const cart = useCartStore()\nconst { count, subtotal } = storeToRefs(cart)\n// actions: call them on the store → cart.add(id)` },
      explanation: 'A store is a reactive object. Destructuring copies the current values out of it. `storeToRefs()` converts state and getters into refs that stay connected (it skips actions, which you call on the store).',
    },
    {
      title: 'Copying product data into the cart',
      wrong: { lang: 'js', code: `items.value.push({ ...product, quantity: 1 }) // price frozen at add time` },
      right: { lang: 'js', code: `items.value.push({ productId: product.id, quantity: 1 })\n// lines getter joins with the current product` },
      explanation: 'Copies go stale when the catalogue changes, bloat storage and tempt you to trust a price the user could edit. Store ids; derive the rest.',
    },
    {
      title: 'Enforcing stock only in the template',
      wrong: { lang: 'vue', code: `<button :disabled="inCart >= product.stock" @click="cart.items.push({ productId: product.id, quantity: 1 })">` },
      right: { lang: 'js', code: `function add(productId) {\n  if (!canAdd(productId)) return false\n  // …\n}` },
      explanation: 'Mutating store state from components scatters the rules. Put them in actions; the disabled button is just a hint.',
    },
    {
      title: 'Calling `$reset()` on a setup store',
      wrong: { lang: 'js', code: `cart.$reset() // Error: setup stores do not implement $reset()` },
      right: { lang: 'js', code: `function clear() {\n  items.value = []\n  couponCode.value = ''\n}` },
      explanation: 'Options stores get `$reset()` for free because Pinia can call `state()` again. A setup store has no `state()` function, so write your own reset action.',
    },
    {
      title: 'Trusting the client total at checkout',
      wrong: { lang: 'js', code: `await api.charge({ amount: cart.total }) // the user can change this in devtools`, static: true },
      right: { lang: 'js', code: `await api.checkout({ items: cart.items, couponCode: cart.couponCode })\n// the server looks up prices, checks stock and coupons, and computes the amount`, static: true },
      explanation: 'Anything in the browser can be modified. Client-side totals are for display; the server must recompute and authorize every charge.',
    },
  ],

  debugging: [
    {
      symptom: 'The badge stays at 0 even though the panel shows items.',
      cause: 'The header destructured `count` from the store without `storeToRefs`, freezing its value.',
      fix: 'Use `cart.count` in the template, or `const { count } = storeToRefs(cart)`.',
    },
    {
      symptom: '"getActivePinia() was called but there was no active Pinia".',
      cause: 'A store was used before `app.use(pinia)` — for example at the top level of a module imported by `main.js`.',
      fix: 'Call `useXStore()` inside components, actions or after `app.use(pinia)`; in tests, call `setActivePinia(createPinia())` first.',
    },
    {
      symptom: 'Quantity changes are not saved, but adding a new product is.',
      cause: 'The persistence watcher is not deep, so `item.quantity++` inside the array is not detected.',
      fix: 'Use `{ deep: true }` (or `$subscribe`, which reports nested changes).',
    },
  ],

  quiz: [
    {
      id: 'project-ecommerce-cart-q1',
      type: 'mcq',
      prompt: 'Why does the cart store keep `{ productId, quantity }` instead of a copy of each product?',
      options: [
        { text: 'Pinia cannot store nested objects', why: 'Pinia state can hold any serialisable structure, including nested objects.' },
        { text: 'So prices, names and stock always come from the current catalogue, and the saved cart cannot carry stale or tampered prices' },
        { text: 'Because `localStorage` only accepts numbers', why: 'localStorage stores strings; we JSON.stringify objects into it.' },
        { text: 'It makes the cart faster to render', why: 'Rendering speed is not the reason; correctness is.' },
      ],
      answer: 1,
      explanation: 'Storing references (ids) and deriving details avoids duplicated, stale data — the same "store the minimum" rule from Project 1, applied to shared state.',
    },
    {
      id: 'project-ecommerce-cart-q2',
      type: 'output',
      prompt: 'What does the template show after the button is clicked twice?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useCartStore } from './stores/cart.js'
const cart = useCartStore()
const { count } = cart
</script>

<template>
  <button @click="cart.add('p1')">Add</button>
  <p>{{ count }}</p>
</template>`,
      },
      options: ['2', '0', '1', 'It throws an error'],
      answer: 1,
      explanation: 'Destructuring copies the value of `count` (0) at setup time. The store does update, but this local constant never will. Use `storeToRefs(cart)` or `cart.count`.',
    },
    {
      id: 'project-ecommerce-cart-q3',
      type: 'bug',
      prompt: 'Clicking **Remove** throws "remove is not a function". Click the line with the bug.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { storeToRefs } from 'pinia'
import { useCartStore } from '../stores/cart.js'

const cart = useCartStore()
const { lines, total, remove } = storeToRefs(cart)
</script>

<template>
  <li v-for="line in lines" :key="line.product.id">
    {{ line.product.name }}
    <button @click="remove(line.product.id)">Remove</button>
  </li>
</template>`,
      },
      answerLine: 6,
      explanation: '`storeToRefs()` only returns refs for state and getters — it skips actions, so `remove` is undefined. Destructure actions from the store itself (`const { remove } = cart`) or call `cart.remove(...)`.',
    },
    {
      id: 'project-ecommerce-cart-q4',
      type: 'fill',
      prompt: 'Complete the store definition and the reactive destructuring in a component.',
      code: { lang: 'js', code: `export const useCartStore = ___('cart', () => {\n  const items = ref([])\n  return { items }\n})\n\n// in a component\nconst { items } = ___(useCartStore())` },
      answer: [['defineStore'], ['storeToRefs']],
      explanation: '`defineStore(id, setup)` creates the store; `storeToRefs(store)` destructures state and getters without losing reactivity.',
    },
    {
      id: 'project-ecommerce-cart-q5',
      type: 'short',
      prompt: 'The cart computes a total in the browser. Why must the server compute the amount again at checkout?',
      answer: 'Everything in the browser — prices, quantities, coupon codes, the computed total, even the JavaScript itself — can be changed by the user with devtools or a modified request. The server must look up real prices and stock, validate the coupon and compute the amount to charge itself; the client total is only for display.',
    },
  ],

  interview: [
    {
      id: 'project-ecommerce-cart-when-store',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why did you use Pinia for the cart instead of keeping it in `App.vue` and passing it down?',
      answer: 'The cart is read and changed by components in different branches — product cards, the header badge, the cart panel. Owning it in App would mean drilling props and re-emitting events through components that do not care. A store gives every component direct access, keeps rules in actions, and adds devtools support. Local UI state (the coupon input text) still stays in its component.',
      explanation: 'Shared across distant components (or must outlive a component) → store. Otherwise → local state or props.',
      whyAsked: 'Checks that you choose state management deliberately rather than putting everything in a store.',
      mistakes: ['"Pinia is always better" — overusing global state.', 'Not mentioning that local UI state stays local.'],
      followUps: ['When would `provide/inject` be enough?', 'What goes wrong if everything is global?'],
      modelAnswer: 'The cart is needed by components far apart in the tree: each product card, the header badge and the cart panel. Keeping it in App would force intermediate components to pass props and events they do not use. A Pinia store lets each component read the cart directly and change it only through actions, where the stock and coupon rules live, and it shows up in devtools. I still keep purely local state, like the coupon input text, inside its component. For a subtree-only concern, provide and inject would be enough.',
    },
    {
      id: 'project-ecommerce-cart-destructure-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'In code review you see `const { count, add } = useCartStore()` in the header. The badge never updates. Explain and fix it.',
      answer: 'Destructuring a reactive store copies `count`\'s current value into a plain constant, so it never updates. `add` still works because functions are fine to destructure. Fix: `const cart = useCartStore(); const { count } = storeToRefs(cart); const { add } = cart` — or use `cart.count` directly in the template.',
      explanation: 'Reactivity lives in property access on the store; destructuring breaks that link.',
      whyAsked: 'The most common Pinia bug; tests understanding of how reactivity works with proxies.',
      mistakes: ['Wrapping everything in `computed` without understanding why.', 'Passing the whole store to `storeToRefs` and destructuring actions from it.'],
      followUps: ['Why does `storeToRefs` skip actions?', 'Would `toRefs(cart)` work?'],
      modelAnswer: 'The store is a reactive object, and reactivity is tracked when you read properties on it. Destructuring reads count once and stores the number in a local constant, so the template has nothing reactive to track. Actions are just functions, so destructuring add is fine. The fix is storeToRefs for state and getters — it returns refs linked to the store — and calling or destructuring actions from the store itself. toRefs would also convert actions into refs, which is why Pinia provides storeToRefs.',
    },
    {
      id: 'project-ecommerce-cart-price-change',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A customer adds a pan to their cart on Monday. On Wednesday the price goes up and only one is left, but their saved cart has two. What should happen when they come back, and where is it handled?',
      answer: 'Because the cart stores only ids and quantities, prices are always read from the current catalogue, so the new price shows automatically. On restore, quantities are clamped to current stock (and unknown products removed); ideally the UI tells the user what changed. At checkout the server re-checks price and stock and rejects or asks for confirmation if anything differs from what the user saw.',
      explanation: 'Client restores and explains; server decides.',
      whyAsked: 'Real e-commerce edge case that tests data modelling and client/server responsibilities.',
      mistakes: ['Storing prices in the saved cart and charging them.', 'Silently changing quantities without telling the user.'],
      followUps: ['How would you show "price changed" messages?', 'What if the product was deleted?'],
      modelAnswer: 'Since the cart only stores product ids and quantities, the current price comes from the catalogue the moment the cart is rendered — no stale prices. When the store restores the cart I clamp each quantity to the current stock and drop products that no longer exist; I would also record those adjustments and show a notice like "only 1 pan left, we updated your cart". None of that is authoritative, though: at checkout the server looks up prices and stock again, and if they differ from what the client sent it rejects or asks the user to confirm.',
    },
    {
      id: 'project-ecommerce-cart-store-design',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'Walk through how you structured the stores. Why two stores, setup syntax, and persistence inside the cart store?',
      answer: 'The products store owns the catalogue and filter; the cart store owns items and coupon and *uses* the products store for prices and stock — separate concerns, one dependency direction. Setup stores match the Composition API used everywhere else and allow `watch` and composables inside; the trade-off is no built-in `$reset`, so I wrote `clear()`. Persistence lives in the cart store (restore on creation, deep watcher to save) so it cannot be forgotten; a `$subscribe` or a Pinia plugin are alternatives when several stores need it.',
      explanation: 'Small focused stores, explicit dependencies, persistence close to the state it protects.',
      whyAsked: 'Shows whether you can design state, not just use it.',
      mistakes: ['One giant store for everything.', 'Circular store dependencies.', 'Putting HTTP and formatting logic in getters.'],
      followUps: ['How do you avoid circular dependencies between stores?', 'When would you choose an options store?'],
      modelAnswer: 'I split by domain: a products store for the catalogue and filter, and a cart store for items and the coupon. The cart depends on products to look up prices and stock, never the reverse, so there is no cycle. I used setup stores because they read exactly like script setup, so I can use computed, watch and composables; the cost is that I have to write my own reset. Persistence sits inside the cart store — it restores on creation, validating against current stock, and saves with a deep watcher — so it is impossible to forget. If several stores needed persistence I would move it into a Pinia plugin.',
    },
    {
      id: 'project-ecommerce-cart-tampering',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A tester opens devtools, edits the saved cart in localStorage to `quantity: 999` and sets a fake coupon, then edits the store state to make the total $0.01. What does your app do, and what must the backend do?',
      answer: 'On reload the client sanitises what it can: quantities are clamped to stock and unknown coupons ignored. But the tester can still change live store state or send any request directly, so the client cannot be trusted. The backend must treat the checkout request as untrusted input: accept only ids, quantities and a coupon code, look up prices and stock itself, validate the coupon and limits, compute the total server-side and charge that amount.',
      explanation: 'Client-side validation improves UX; server-side validation provides security.',
      whyAsked: 'Security awareness is essential for any app that handles money or permissions.',
      mistakes: ['Saying "we validate in the store, so it is safe".', 'Encrypting localStorage as the fix.', 'Sending the computed total to the payment API.'],
      followUps: ['What would you log on the server?', 'How do you show the user the server\'s final amount?'],
      modelAnswer: 'The client does some hygiene — when the cart is restored, quantities are clamped to stock and unknown coupons are dropped — but that only protects honest users from stale data. Anyone can edit store state in devtools or skip the UI and call the API directly. So the server treats checkout as untrusted input: it accepts product ids, quantities and a coupon code, recomputes prices, stock, discounts and shipping from its own data, and charges only that amount. The client then displays the server\'s confirmed total.',
    },
    {
      id: 'project-ecommerce-cart-coding-wishlist',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement a setup store `useWishlistStore` in `stores/wishlist.js`. State: `ids` (array of product ids). Getter: `count`. Actions/helpers: `has(id)`, `toggle(id)` (adds if missing, removes if present — never duplicates) and `clear()`.',
      starter: { files: { 'App.vue': wishlistApp, 'stores/wishlist.js': wishlistStarter } },
      tests: [
        {
          name: 'toggle adds and removes without duplicates',
          code: `${freshPinia}
wishlist.toggle('p1')
wishlist.toggle('p2')
expect(wishlist.has('p1')).toBe(true)
expect(wishlist.count).toBe(2)
wishlist.toggle('p1')
expect(wishlist.has('p1')).toBe(false)
expect(wishlist.ids).toEqual(['p2'])`,
        },
        {
          name: 'every caller shares the same store instance',
          code: `${freshPinia}
wishlist.toggle('p7')
expect(useWishlistStore()).toBe(wishlist)
expect(useWishlistStore().count).toBe(1)`,
        },
        {
          name: 'clear() empties the list',
          code: `${freshPinia}
wishlist.toggle('p1')
wishlist.toggle('p4')
wishlist.clear()
expect(wishlist.count).toBe(0)
expect(wishlist.has('p4')).toBe(false)`,
        },
      ],
      hints: [
        '`count` is derived: `computed(() => ids.value.length)`.',
        'Write `has(id)` with `includes`, then use it inside `toggle`.',
        'Return every piece you want to expose from the setup function: `{ ids, count, has, toggle, clear }`.',
      ],
      answer: 'Keep `ids` in a ref, derive `count` with computed, implement `has` with includes, make `toggle` filter the id out when present or push it otherwise, and `clear` reset the array. Return them all.',
      solution: { files: { 'App.vue': wishlistApp, 'stores/wishlist.js': wishlistSolution } },
      explanation: 'A setup store is just a function returning refs, computeds and functions. Pinia creates it once per Pinia instance, so every `useWishlistStore()` call returns the same object.',
      whyAsked: 'Quick check that you can write a store from scratch and know what makes state shared.',
      mistakes: ['Forgetting to return `has` or `count`, so they are not on the store.', 'Pushing duplicates.', 'Storing `count` in a separate ref.'],
      followUps: ['How would you persist the wishlist?', 'How would you test it alongside the cart store?'],
      modelAnswer: 'In a setup store I keep ids in a ref, derive count with computed, and write has with includes. Toggle checks has: if present it filters the id out, otherwise it pushes it, so duplicates are impossible. Clear resets the array, which also replaces the missing $reset for setup stores. Everything is returned from the setup function. Because Pinia caches the store per Pinia instance, every useWishlistStore call shares the same state, which the second test proves.',
    },
  ],

  takeaways: [
    'Use a store when distant components share state; keep local UI state local.',
    'Setup stores: refs are state, computeds are getters, functions are actions — and stores can use other stores.',
    'Destructure state and getters with `storeToRefs()`; call actions on the store.',
    'Store ids and quantities, derive lines and totals, and enforce rules (stock, coupons) inside actions.',
    'Persist and validate on restore — and never trust client totals: the server recomputes everything at checkout.',
  ],
}
