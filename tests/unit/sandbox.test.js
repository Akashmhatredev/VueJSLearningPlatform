import { describe, expect, it } from 'vitest'
import * as sfc from 'vue/compiler-sfc'
import { compileProject, resolvePath, transformModule } from '../../src/services/sandbox/compile.js'
import { runProjectTests } from './sandbox-runner.js'

const passes = (r) => {
  expect(r.compileErrors ?? []).toEqual([])
  expect(r.results.filter((x) => !x.pass).map((x) => `${x.name}: ${x.error}`)).toEqual([])
}

describe('compileProject', () => {
  it('compiles script setup, options API, scoped CSS and CSS modules', async () => {
    const res = await compileProject(
      {
        'App.vue': `<script setup>\nimport { ref } from 'vue'\nimport Child from './Child.vue'\nconst n = ref(1)\n</script>\n<template><Child :n="n" /></template>\n<style scoped>p{color:red}</style>`,
        'Child.vue': `<script>\nexport default { props: ['n'] }\n</script>\n<template><p :class="$style.x">{{ n }}</p></template>\n<style module>.x{color:blue}</style>`,
      },
      sfc,
    )
    expect(res.errors).toEqual([])
    expect(res.entry).toBe('App.vue')
    expect(res.css).toMatch(/\[data-v-[0-9a-f]{8}\]/)
    expect(res.modules.find((m) => m.id === 'Child.vue').code).toContain('__cssModules')
  })

  it('reports template errors with a code frame', async () => {
    const res = await compileProject({ 'App.vue': '<template><div>{{ a </div></template>' }, sfc)
    expect(res.errors.length).toBeGreaterThan(0)
    expect(res.errors[0].message).toContain('|')
  })

  it('rejects unknown packages and TypeScript', async () => {
    const res = await compileProject(
      {
        'App.vue': `<script setup>import axios from 'axios'</script><template>x</template>`,
        'B.vue': `<script setup lang="ts">const a: number = 1</script><template>x</template>`,
      },
      sfc,
    )
    expect(res.errors.map((e) => e.message).join('\n')).toMatch(/axios/)
    expect(res.errors.map((e) => e.message).join('\n')).toMatch(/lang="ts"/)
  })

  it('prefers main.js as the entry when present', async () => {
    const res = await compileProject({ 'App.vue': '<template>x</template>', 'main.js': `import App from './App.vue'` }, sfc)
    expect(res.entry).toBe('main.js')
  })
})

describe('transformModule', () => {
  it('rewrites imports/exports and guards loops', () => {
    const { code, deps } = transformModule(
      `import { ref as r } from 'vue'\nimport * as ns from './x.js'\nexport const a = 1\nexport function f() { while (true) break }\nexport default 5\nexport { a as b }`,
      'm.js',
      sfc,
    )
    expect(deps).toEqual(['vue', './x.js'])
    expect(code).toContain('const r = __i0["ref"]')
    expect(code).toContain('__exports__.default = 5')
    expect(code).toContain('__guard__("m.js")')
    expect(code).not.toMatch(/^\s*export /m)
  })

  it('resolves relative paths with or without extensions', () => {
    const files = { 'App.vue': '', 'components/Card.vue': '', 'lib/use.js': '' }
    expect(resolvePath('./components/Card', 'App.vue', files)).toBe('components/Card.vue')
    expect(resolvePath('../lib/use.js', 'components/Card.vue', files)).toBe('lib/use.js')
    expect(resolvePath('vue', 'App.vue', files)).toBe('vue')
    expect(resolvePath('./missing', 'App.vue', files)).toBe(null)
  })
})

describe('sandbox test runner', () => {
  it('mounts fresh per test and supports DOM helpers', async () => {
    const files = {
      'App.vue': `<script setup>\nimport { ref } from 'vue'\nconst n = ref(0)\nconst name = ref('')\n</script>\n<template><p class="n">{{ n }}</p><button @click="n++">+</button><input v-model="name" /><span class="name">{{ name }}</span><p v-show="n > 1" class="big">big</p></template>`,
    }
    const r = await runProjectTests(files, [
      { name: 'click', code: `await click('button'); expect(text('.n')).toBe('1'); expect(state.n).toBe(1)` },
      { name: 'fresh mount', code: `expect(text('.n')).toBe('0')` },
      { name: 'v-model', code: `await type('input', 'Ada'); expect(text('.name')).toBe('Ada')` },
      { name: 'v-show', code: `expect(isVisible('.big')).toBe(false); await click('button'); await click('button'); expect(isVisible('.big')).toBe(true)` },
    ])
    passes(r)
  })

  it('reports failures with readable messages', async () => {
    const r = await runProjectTests({ 'App.vue': '<template><p class="x">a</p></template>' }, [
      { name: 'wrong', code: `expect(text('.x')).toBe('b')` },
      { name: 'missing element', code: `await click('.nope')` },
    ])
    expect(r.results.map((x) => x.pass)).toEqual([false, false])
    expect(r.results[0].error).toContain('to be "b"')
    expect(r.results[1].error).toContain('No element matches')
  })

  it('runs Pinia apps through main.js', async () => {
    const files = {
      'main.js': `import { createApp } from 'vue'\nimport { createPinia } from 'pinia'\nimport App from './App.vue'\ncreateApp(App).use(createPinia()).mount('#app')`,
      'store.js': `import { defineStore } from 'pinia'\nimport { ref, computed } from 'vue'\nexport const useCart = defineStore('cart', () => {\n  const items = ref([])\n  const count = computed(() => items.value.length)\n  function add(x) { items.value.push(x) }\n  return { items, count, add }\n})`,
      'App.vue': `<script setup>\nimport { useCart } from './store.js'\nconst cart = useCart()\n</script>\n<template><button @click="cart.add('apple')">add</button><span class="count">{{ cart.count }}</span></template>`,
    }
    const r = await runProjectTests(files, [
      { name: 'adds', code: `await click('button'); await click('button'); expect(text('.count')).toBe('2')` },
      { name: 'fresh store per test', code: `expect(text('.count')).toBe('0')` },
    ])
    passes(r)
  })

  it('runs Vue Router apps with memory history', async () => {
    const files = {
      'main.js': `import { createApp } from 'vue'\nimport { createRouter, createMemoryHistory } from 'vue-router'\nimport App from './App.vue'\nconst Home = { template: '<h2>Home</h2>' }\nconst User = { props: ['id'], template: '<h2>User {{ id }}</h2>' }\nconst router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Home }, { path: '/users/:id', component: User, props: true }] })\ncreateApp(App).use(router).mount('#app')`,
      'App.vue': `<template><nav><RouterLink to="/users/7" class="u">user</RouterLink></nav><RouterView /></template>`,
    }
    const r = await runProjectTests(files, [
      { name: 'navigates', code: `await wait(20); expect(text('h2')).toBe('Home'); await click('.u'); await wait(20); expect(text('h2')).toBe('User 7')` },
    ])
    passes(r)
  })

  it('supports mountFile, withSetup, requireModule and logs', async () => {
    const files = {
      'App.vue': `<script setup>\nimport { watch, ref } from 'vue'\nconst n = ref(0)\nwatch(n, (v) => console.log('n is', v))\n</script>\n<template><button @click="n++">{{ n }}</button></template>`,
      'Rating.vue': `<script setup>\nconst props = defineProps({ modelValue: Number })\nconst emit = defineEmits(['update:modelValue'])\n</script>\n<template><button class="star" @click="emit('update:modelValue', props.modelValue + 1)">{{ modelValue }}</button></template>`,
      'useCounter.js': `import { ref } from 'vue'\nexport function useCounter(start = 0) { const count = ref(start); return { count, inc: () => count.value++ } }`,
    }
    const r = await runProjectTests(files, [
      { name: 'logs', code: `await click('button'); expect(logs.join('\\n')).toContain('n is 1')` },
      { name: 'mountFile', code: `const w = mountFile('Rating.vue', { modelValue: 3 }); await click(w.find('.star')); expect(w.emitted('update:modelValue')[0]).toEqual([4]); expect(w.text()).toBe('4')` },
      { name: 'withSetup', code: `const { useCounter } = requireModule('useCounter.js'); const c = withSetup(() => useCounter(5)); c.inc(); expect(c.count.value).toBe(6)` },
    ])
    passes(r)
  })

  it('stops infinite loops instead of hanging', async () => {
    const files = { 'App.vue': `<script setup>\nfunction spin() { let i = 0; while (true) { i++ } }\n</script>\n<template><button @click="spin">go</button></template>` }
    const r = await runProjectTests(files, [{ name: 'loop', code: `await click('button')` }])
    expect(r.logs.join('\n')).toMatch(/infinite loop/i)
  })
})

describe('sandbox module features', () => {
  it('supports dynamic import() and import.meta.env', async () => {
    const files = {
      'App.vue': `<script setup>\nimport { defineAsyncComponent } from 'vue'\nconst Lazy = defineAsyncComponent(() => import('./Lazy.vue'))\nconst mode = import.meta.env.MODE\n</script>\n<template><p class="mode">{{ mode }}</p><Lazy /></template>`,
      'Lazy.vue': `<template><h2>loaded lazily</h2></template>`,
    }
    const r = await runProjectTests(files, [
      { name: 'lazy', code: `expect(text('.mode')).toBe('development'); await wait(30); expect(text('h2')).toBe('loaded lazily')` },
    ])
    passes(r)
  })
})

describe('sandbox timers', () => {
  it('clears timers leaked by project code between tests', async () => {
    const files = {
      'ticker.js': `export let ticks = 0\nexport function start() { setInterval(() => { ticks++ }, 5) }\nexport const read = () => ticks`,
      'App.vue': `<script setup>\nimport { start } from './ticker.js'\nstart()\n</script>\n<template><p>tick</p></template>`,
    }
    const r = await runProjectTests(files, [
      { name: 'first', code: `await wait(40); expect(requireModule('ticker.js').read()).toBeGreaterThan(2)` },
      { name: 'second starts fresh', code: `expect(requireModule('ticker.js').read()).toBe(0)` },
    ])
    passes(r)
  })
})

describe('sandbox state inspection', () => {
  it('does not walk into Pinia internals (no enumerate-keys warning)', async () => {
    const files = {
      'main.js': `import { createApp } from 'vue'\nimport { createPinia } from 'pinia'\nimport App from './App.vue'\ncreateApp(App).use(createPinia()).mount('#app')`,
      'store.js': `import { defineStore } from 'pinia'\nexport const useCart = defineStore('cart', { state: () => ({ items: [] }), actions: { add(x) { this.items.push(x) } } })`,
      'App.vue': `<script setup>\nimport { useCart } from './store.js'\nconst cart = useCart()\n</script>\n<template><button @click="cart.add('a')">{{ cart.items.length }}</button></template>`,
    }
    const r = await runProjectTests(files, [{ name: 'click', code: `await click('button'); await click('button'); await wait(10); expect(text('button')).toBe('2')` }])
    passes(r)
    expect(r.logs.filter((l) => /enumerating keys/.test(l))).toEqual([])
  })
})

describe('sandbox matchers and helpers', () => {
  it('toEqual ignores key order; query() sees teleported nodes', async () => {
    const files = { 'App.vue': `<template><p>x</p><Teleport to="body"><div class="tp">moved</div></Teleport></template>` }
    const r = await runProjectTests(files, [
      { name: 'equal', code: `expect({ a: 1, b: [1, { c: 2, d: 3 }] }).toEqual({ b: [1, { d: 3, c: 2 }], a: 1 }); expect({ a: 1 }).not.toEqual({ a: 2 })` },
      { name: 'teleport', code: `expect(exists('.tp')).toBe(false); expect(query('.tp').textContent).toBe('moved')` },
    ])
    passes(r)
  })
})

describe('sandbox state inspection with the router', () => {
  it('does not enumerate component instances reachable from useRoute()', async () => {
    const files = {
      'main.js': `import { createApp } from 'vue'\nimport { createRouter, createMemoryHistory } from 'vue-router'\nimport App from './App.vue'\nconst Page = { template: '<p class="pg">page</p>' }\nconst router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: Page }, { path: '/b', component: Page }] })\ncreateApp(App).use(router).mount('#app')`,
      'App.vue': `<script setup>\nimport { useRoute, useRouter } from 'vue-router'\nconst route = useRoute()\nconst router = useRouter()\n</script>\n<template><p class="path">{{ route.path }}</p><button @click="router.push('/b')">go</button><RouterView /></template>`,
    }
    const r = await runProjectTests(files, [{ name: 'nav', code: `await wait(20); await click('button'); await wait(30); expect(text('.path')).toBe('/b')` }])
    passes(r)
    expect(r.logs.filter((l) => /enumerating keys/.test(l))).toEqual([])
  })
})

describe('curated playground examples', async () => {
  const { playgroundExamples } = await import('../../src/content/playground-examples.js')
  const sets = playgroundExamples.flatMap((ex) => [[ex.id, ex.files], ...(ex.variants ?? []).map((v) => [`${ex.id}/${v.id}`, v.files])])
  it.each(sets)('%s mounts and renders', async (_, files) => {
    const r = await runProjectTests(files, [{ name: 'renders', code: `await wait(30); expect(text().length).toBeGreaterThan(0)` }])
    passes(r)
  })
})
