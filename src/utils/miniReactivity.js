// A deliberately tiny reactivity engine used by the visualizers.
// It follows the same ideas as Vue (track on read, trigger on write, lazy
// cached computeds, queued effects flushed in order) but it is a TEACHING
// MODEL, not Vue's implementation. Every step emits an event so the UI can
// replay exactly what happened.

const PRIORITY = { watch: 0, render: 1, effect: 1 } // pre-flush watchers run before renders

export function createEngine(emit = () => {}) {
  let active = null
  const queue = []
  const deps = new Map() // name -> dep

  function depFor(name) {
    if (!deps.has(name)) deps.set(name, { name, subs: new Set() })
    return deps.get(name)
  }

  function track(dep) {
    if (!active) return
    if (!dep.subs.has(active)) {
      dep.subs.add(active)
      active.deps.add(dep)
    }
    emit({ type: 'track', dep: dep.name, effect: active.name, kind: active.kind })
  }

  function trigger(dep) {
    const subs = [...dep.subs]
    emit({ type: 'trigger', dep: dep.name, subs: subs.map((s) => s.name) })
    for (const s of subs) s.notify()
  }

  function cleanup(runner) {
    for (const d of runner.deps) d.subs.delete(runner)
    runner.deps.clear()
  }

  function ref(name, initial) {
    const dep = depFor(name)
    let value = initial
    return {
      name,
      dep,
      get value() {
        track(dep)
        return value
      },
      set value(next) {
        if (Object.is(next, value)) {
          emit({ type: 'same', dep: name, value })
          return
        }
        const old = value
        value = next
        emit({ type: 'set', dep: name, old, value: next })
        trigger(dep)
      },
      peek: () => value,
    }
  }

  // Per-property tracking, like reactive(): "cart.items" and "cart.note" are separate deps.
  function reactive(name, target) {
    return new Proxy(target, {
      get(obj, key) {
        if (typeof key === 'symbol') return obj[key]
        track(depFor(`${name}.${key}`))
        return obj[key]
      },
      set(obj, key, next) {
        const old = obj[key]
        if (Object.is(old, next)) {
          emit({ type: 'same', dep: `${name}.${key}`, value: next })
          return true
        }
        obj[key] = next
        emit({ type: 'set', dep: `${name}.${String(key)}`, old, value: next })
        trigger(depFor(`${name}.${String(key)}`))
        return true
      },
    })
  }

  function computed(name, getter) {
    const dep = depFor(name)
    let dirty = true
    let cached
    const runner = {
      name,
      kind: 'computed',
      deps: new Set(),
      notify() {
        if (dirty) return
        dirty = true
        emit({ type: 'dirty', effect: name })
        trigger(dep) // tell whoever reads this computed that it may have changed
      },
    }
    return {
      name,
      dep,
      runner,
      get value() {
        track(dep)
        if (dirty) {
          cleanup(runner)
          const prev = active
          active = runner
          emit({ type: 'run', effect: name, kind: 'computed' })
          try {
            cached = getter()
          } finally {
            active = prev
          }
          dirty = false
          emit({ type: 'computed', effect: name, value: cached })
        } else {
          emit({ type: 'cache-hit', effect: name, value: cached })
        }
        return cached
      },
      peek: () => cached,
      isDirty: () => dirty,
    }
  }

  function effect(name, fn, { kind = 'effect', immediate = true } = {}) {
    const runner = {
      name,
      kind,
      deps: new Set(),
      run() {
        cleanup(runner)
        const prev = active
        active = runner
        emit({ type: 'run', effect: name, kind })
        let out
        try {
          out = fn()
        } finally {
          active = prev
        }
        if (kind === 'render') emit({ type: 'render', effect: name, output: out })
        return out
      },
      notify() {
        if (queue.includes(runner)) return emit({ type: 'dedupe', effect: name })
        queue.push(runner)
        emit({ type: 'queued', effect: name, kind })
      },
    }
    if (immediate) runner.run()
    return runner
  }

  function watch(name, source, callback) {
    let old
    let first = true
    const runner = effect(
      name,
      () => {
        const value = source()
        if (first) {
          first = false
          old = value
          return
        }
        if (!Object.is(value, old)) {
          emit({ type: 'callback', effect: name, value, old })
          callback(value, old)
          old = value
        } else {
          emit({ type: 'unchanged', effect: name, value })
        }
      },
      { kind: 'watch' },
    )
    return runner
  }

  /** Run queued effects: pre-flush watchers first, then renders (like Vue's scheduler). */
  function flush() {
    if (!queue.length) {
      emit({ type: 'idle' })
      return
    }
    emit({ type: 'flush', effects: queue.map((r) => r.name) })
    queue.sort((a, b) => (PRIORITY[a.kind] ?? 1) - (PRIORITY[b.kind] ?? 1))
    while (queue.length) queue.shift().run()
  }

  function graph() {
    return [...deps.values()].map((d) => ({ dep: d.name, subs: [...d.subs].map((s) => s.name) }))
  }

  return { ref, reactive, computed, effect, watch, flush, graph }
}
