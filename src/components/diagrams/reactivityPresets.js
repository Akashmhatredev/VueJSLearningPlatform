// Scenarios for the reactivity visualizer. Each one mirrors a real Vue
// snippet (shown to the learner) and models it with the mini engine.

export const presets = {
  ref: {
    title: 'ref()',
    code: `<script setup>
import { ref } from 'vue'

const score = ref(0)
const add = () => score.value++
</script>

<template>
  <h2>Score: {{ score }}</h2>
  <button @click="add">+1</button>
</template>`,
    lines: { create: [4, 4], render: [9, 10] },
    setup(e) {
      const score = e.ref('score', 0)
      return {
        render: () => `Score: ${score.value}`,
        actions: [
          { id: 'add', label: 'score.value++', line: [5, 5], run: () => score.value++ },
          { id: 'same', label: 'score.value = score.value', line: [5, 5], run: () => (score.value = score.peek()) },
        ],
      }
    },
  },

  reactive: {
    title: 'reactive()',
    code: `<script setup>
import { reactive } from 'vue'

const cart = reactive({ items: 2, price: 5, note: '' })
</script>

<template>
  <p>{{ cart.items }} × \${{ cart.price }}</p>
</template>`,
    lines: { create: [4, 4], render: [8, 8] },
    setup(e) {
      const cart = e.reactive('cart', { items: 2, price: 5, note: '' })
      return {
        render: () => `${cart.items} × $${cart.price}`,
        actions: [
          { id: 'items', label: 'cart.items++', line: [4, 4], run: () => cart.items++ },
          { id: 'price', label: 'cart.price += 1', line: [4, 4], run: () => (cart.price += 1) },
          { id: 'note', label: "cart.note = 'gift'", line: [4, 4], run: () => (cart.note = cart.note === 'gift' ? 'wrap it' : 'gift') },
        ],
      }
    },
  },

  computed: {
    title: 'computed()',
    code: `<script setup>
import { ref, computed } from 'vue'

const price = ref(5)
const qty = ref(1)
const total = computed(() => price.value * qty.value)
</script>

<template>
  <p>Total: {{ total }}</p>
  <p>Again: {{ total }}</p>
</template>`,
    lines: { create: [4, 6], computed: [6, 6], render: [10, 11] },
    setup(e) {
      const price = e.ref('price', 5)
      const qty = e.ref('qty', 1)
      const total = e.computed('total', () => price.value * qty.value)
      return {
        render: () => `Total: ${total.value} · Again: ${total.value}`,
        actions: [
          { id: 'qty', label: 'qty.value++', line: [5, 5], run: () => qty.value++ },
          { id: 'price', label: 'price.value += 5', line: [4, 4], run: () => (price.value += 5) },
          { id: 'same', label: 'qty.value = qty.value', line: [5, 5], run: () => (qty.value = qty.peek()) },
        ],
      }
    },
  },

  watch: {
    title: 'watch()',
    code: `<script setup>
import { ref, watch } from 'vue'

const qty = ref(1)
watch(qty, (now, before) => {
  console.log(\`qty: \${before} → \${now}\`)
})
</script>

<template>
  <p>Qty: {{ qty }}</p>
</template>`,
    lines: { create: [4, 4], watch: [5, 7], render: [11, 11] },
    setup(e, log) {
      const qty = e.ref('qty', 1)
      e.watch('watch(qty)', () => qty.value, (now, before) => log(`qty: ${before} → ${now}`))
      return {
        render: () => `Qty: ${qty.value}`,
        actions: [
          { id: 'qty', label: 'qty.value++', line: [4, 4], run: () => qty.value++ },
          { id: 'same', label: 'qty.value = qty.value', line: [4, 4], run: () => (qty.value = qty.peek()) },
        ],
      }
    },
  },

  compare: {
    title: 'ref · reactive · computed · watch',
    code: `<script setup>
import { ref, reactive, computed, watch } from 'vue'

const price = ref(5)                          // ref
const cart = reactive({ qty: 1, note: '' })   // reactive
const total = computed(() => price.value * cart.qty)
watch(total, (t) => console.log('total is now', t))
</script>

<template>
  <p>{{ cart.qty }} × {{ price }} = {{ total }}</p>
</template>`,
    lines: { create: [4, 5], computed: [6, 6], watch: [7, 7], render: [11, 11] },
    setup(e, log) {
      const price = e.ref('price', 5)
      const cart = e.reactive('cart', { qty: 1, note: '' })
      const total = e.computed('total', () => price.value * cart.qty)
      e.watch('watch(total)', () => total.value, (t) => log(`total is now ${t}`))
      return {
        render: () => `${cart.qty} × ${price.value} = ${total.value}`,
        actions: [
          { id: 'qty', label: 'cart.qty++', line: [5, 5], run: () => cart.qty++ },
          { id: 'price', label: 'price.value++', line: [4, 4], run: () => price.value++ },
          { id: 'note', label: "cart.note = 'gift'", line: [5, 5], run: () => (cart.note = cart.note === 'gift' ? 'wrap' : 'gift') },
        ],
      }
    },
  },
}
