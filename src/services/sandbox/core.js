/* eslint-disable */
// Sandbox core — environment-agnostic. Loaded as raw text and evaluated both
// inside the sandboxed iframe (see runtime.js) and inside Vitest (to verify
// that every exercise solution passes its own tests).
//
// Defines one global function: createSandboxCore(opts)
//   opts.Vue        – the Vue module/global
//   opts.document   – document to mount into (must contain #app)
//   opts.externals  – { 'vue': Vue, 'pinia': Pinia, 'vue-router': VueRouter }
//   opts.log(level, argsArray)
//   opts.onState(snapshot)
function createSandboxCore(opts) {
  'use strict'
  var Vue = opts.Vue
  var doc = opts.document
  var log = opts.log || function () {}
  var onState = opts.onState || function () {}
  var defs = Object.create(null)
  var cache = Object.create(null)
  var apps = []
  var stateStop = null
  var currentLogs = null
  var project = null

  // ------------------------------------------------------------ format
  function isEl(v) {
    return typeof Element !== 'undefined' && v instanceof Element
  }
  function format(value, depth, seen, top) {
    if (depth === undefined) depth = 0
    if (!seen) seen = []
    var t = typeof value
    if (value === null) return 'null'
    if (t === 'undefined') return 'undefined'
    if (t === 'string') return top ? value : JSON.stringify(value)
    if (t === 'number' || t === 'boolean' || t === 'bigint') return String(value)
    if (t === 'symbol') return value.toString()
    if (t === 'function') return 'ƒ ' + (value.name || 'anonymous') + '()'
    if (value instanceof Error) return value.name + ': ' + value.message
    if (isEl(value)) {
      return '<' + value.tagName.toLowerCase() + (value.id ? '#' + value.id : '') + (value.className && typeof value.className === 'string' ? '.' + value.className.trim().split(/\s+/).join('.') : '') + '>'
    }
    if (Vue.isRef(value)) {
      var kind = value.constructor && /Computed/.test(value.constructor.name) ? 'ComputedRef' : 'Ref'
      return kind + '<' + format(value.value, depth + 1, seen) + '>'
    }
    if (seen.indexOf(value) !== -1) return '[Circular]'
    if (depth > 3) return Array.isArray(value) ? '[…]' : '{…}'
    var prefix = ''
    if (Vue.isReactive(value) || Vue.isReadonly(value)) {
      prefix = Vue.isReadonly(value) ? 'Readonly ' : 'Reactive '
      value = Vue.toRaw(value)
    }
    seen = seen.concat([value])
    if (value instanceof Date) return prefix + value.toISOString()
    if (value instanceof RegExp) return String(value)
    if (typeof Promise !== 'undefined' && value instanceof Promise) return 'Promise {…}'
    if (value instanceof Map) {
      var mp = []
      value.forEach(function (v, k) {
        if (mp.length < 20) mp.push(format(k, depth + 1, seen) + ' => ' + format(v, depth + 1, seen))
      })
      return prefix + 'Map(' + value.size + ') {' + mp.join(', ') + '}'
    }
    if (value instanceof Set) {
      var sp = []
      value.forEach(function (v) {
        if (sp.length < 20) sp.push(format(v, depth + 1, seen))
      })
      return prefix + 'Set(' + value.size + ') {' + sp.join(', ') + '}'
    }
    if (Array.isArray(value)) {
      var items = value.slice(0, 30).map(function (v) {
        return format(v, depth + 1, seen)
      })
      if (value.length > 30) items.push('…' + (value.length - 30) + ' more')
      return prefix + '[' + items.join(', ') + ']'
    }
    var keys = Object.keys(value)
    var parts = keys.slice(0, 25).map(function (k) {
      var v
      try {
        v = value[k]
      } catch (e) {
        v = '[getter threw]'
      }
      return (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + format(v, depth + 1, seen)
    })
    if (keys.length > 25) parts.push('…')
    var ctor = value.constructor && value.constructor !== Object && value.constructor.name ? value.constructor.name + ' ' : ''
    return prefix + ctor + '{ ' + parts.join(', ') + (parts.length ? ' }' : '}')
  }

  function formatArgs(args) {
    var out = []
    for (var i = 0; i < args.length; i++) {
      try {
        out.push(format(args[i], 0, null, true))
      } catch (e) {
        out.push('[unprintable]')
      }
    }
    return out
  }

  // Captured by the glue layer's console patch so tests can assert on logs.
  function recordLog(text) {
    if (currentLogs) currentLogs.push(text)
  }

  // ------------------------------------------------------------ loop guard
  var guardState = Object.create(null)
  var guardTick = 0
  var guardScheduled = false
  function guard(file) {
    var s = guardState[file]
    var now = Date.now()
    if (!s || s.tick !== guardTick) {
      guardState[file] = { tick: guardTick, start: now }
      if (!guardScheduled) {
        guardScheduled = true
        setTimeout(function () {
          guardTick++
          guardScheduled = false
        }, 0)
      }
      return
    }
    if (now - s.start > 1500) {
      guardState[file] = { tick: -1, start: now }
      throw new Error('Possible infinite loop in ' + file + ' — stopped after 1.5s. Check your loop condition.')
    }
  }

  // ------------------------------------------------------------ vue wrapper
  // Errors and warnings Vue catches are also visible to tests through `logs`.
  function errorHandler(err, instance, info) {
    var name = instance && instance.$options && (instance.$options.__name || instance.$options.name)
    var text = (err && err.name ? err.name + ': ' + err.message : String(err)) + (info ? '  (in ' + info + (name ? ' of <' + name + '>' : '') + ')' : '')
    recordLog(text)
    log('error', [text])
  }
  // Vue warnings are left on Vue's default path (console.warn with the real
  // arguments): the console patch formats elements readably and records them
  // in `logs` for tests.
  function createApp() {
    var app = Vue.createApp.apply(null, arguments)
    app.config.errorHandler = errorHandler
    var mount = app.mount
    app.mount = function () {
      var vm = mount.apply(this, arguments)
      apps.push(app)
      if (apps.length === 1) trackState(app)
      return vm
    }
    return app
  }
  function createSSRApp() {
    var app = Vue.createSSRApp.apply(null, arguments)
    app.config.errorHandler = errorHandler
    var mount = app.mount
    app.mount = function () {
      var vm = mount.apply(this, arguments)
      apps.push(app)
      if (apps.length === 1) trackState(app)
      return vm
    }
    return app
  }
  // User code gets a copy of Vue whose createApp/createSSRApp install error/warn
  // handlers and register the app for cleanup between runs.
  var VueForUser = Object.assign({}, Vue, { createApp: createApp, createSSRApp: createSSRApp })

  // ------------------------------------------------------------ modules
  function exportAll(target, source) {
    Object.keys(source).forEach(function (k) {
      if (k === 'default' || Object.prototype.hasOwnProperty.call(target, k)) return
      Object.defineProperty(target, k, { enumerable: true, get: function () { return source[k] } })
    })
  }
  function injectCSS(text) {
    var el = doc.createElement('style')
    el.setAttribute('data-sandbox-module', '')
    el.textContent = text
    doc.head.appendChild(el)
  }
  function requireModule(id, from) {
    if (id === 'vue') return VueForUser
    if (opts.externals && opts.externals[id]) return opts.externals[id]
    if (id === 'pinia' || id === 'vue-router') throw new Error('"' + id + '" failed to load in the sandbox.')
    if (cache[id]) return cache[id].exports
    var factory = defs[id]
    if (!factory) {
      throw new Error('Cannot import "' + id + '"' + (from ? ' from ' + from : '') + '. Only vue, pinia, vue-router and files in this project are available.')
    }
    // Tag exports like a real module namespace so Vue/Vue Router unwrap `.default` for lazy loads.
    var exportsObj = {}
    Object.defineProperty(exportsObj, Symbol.toStringTag, { value: 'Module' })
    var mod = { exports: exportsObj }
    cache[id] = mod
    var meta = { url: 'sandbox:' + id, env: { MODE: 'development', DEV: true, PROD: false, SSR: false, BASE_URL: '/' } }
    try {
      factory(mod.exports, requireModule, guard, exportAll, injectCSS, dynamicImport, meta, timerApi.setTimeout, timerApi.clearTimeout, timerApi.setInterval, timerApi.clearInterval)
    } catch (e) {
      delete cache[id]
      throw e
    }
    return mod.exports
  }
  // Timers created by project code are tracked so a leaked setInterval from one
  // run/test can't keep firing into the next. Modules receive these as
  // parameters that shadow the globals.
  var liveTimeouts = new Set()
  var liveIntervals = new Set()
  var timerApi = {
    setTimeout: function (fn, ms) {
      var args = Array.prototype.slice.call(arguments, 2)
      var id = setTimeout(function () {
        liveTimeouts.delete(id)
        if (typeof fn === 'function') fn.apply(null, args)
      }, ms)
      liveTimeouts.add(id)
      return id
    },
    clearTimeout: function (id) {
      liveTimeouts.delete(id)
      clearTimeout(id)
    },
    setInterval: function (fn, ms) {
      var args = Array.prototype.slice.call(arguments, 2)
      var id = setInterval(function () {
        if (typeof fn === 'function') fn.apply(null, args)
      }, ms)
      liveIntervals.add(id)
      return id
    },
    clearInterval: function (id) {
      liveIntervals.delete(id)
      clearInterval(id)
    },
  }
  function clearTimers() {
    liveTimeouts.forEach(function (id) { clearTimeout(id) })
    liveIntervals.forEach(function (id) { clearInterval(id) })
    liveTimeouts.clear()
    liveIntervals.clear()
  }

  // import('./Page.vue') resolves asynchronously, like a real lazy chunk.
  function dynamicImport(id, from) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          resolve(requireModule(id, from))
        } catch (e) {
          reject(e)
        }
      }, 0)
    })
  }
  function define(modules) {
    defs = Object.create(null)
    cache = Object.create(null)
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i]
      // ES modules are always strict; keep that behaviour (e.g. `this` is undefined in functions).
      defs[m.id] = new Function('__exports__', '__require__', '__guard__', '__exportAll__', '__css__', '__import__', '__importMeta__', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', '"use strict";\n' + m.code + '\n//# sourceURL=' + m.id)
    }
  }

  // ------------------------------------------------------------ state inspector
  function isComponentLike(v) {
    return v && typeof v === 'object' && (typeof v.render === 'function' || typeof v.setup === 'function' || v.__file || v.template)
  }
  function plain(v, depth) {
    if (depth > 4) return '…'
    if (v === null || typeof v !== 'object') {
      if (typeof v === 'function') return 'ƒ()'
      if (typeof v === 'undefined') return '__undefined__'
      if (typeof v === 'symbol' || typeof v === 'bigint') return String(v)
      return v
    }
    if (Vue.isRef(v)) return plain(v.value, depth + 1)
    if (isEl(v)) return format(v)
    if (v instanceof Date) return v.toISOString()
    if (v instanceof Map || v instanceof Set) return format(v)
    // Pinia stores: show their state only (walking the store would reach the
    // app and component instances).
    if (typeof v.$id === 'string' && v.$state) return plain(v.$state, depth + 1)
    if (v.__v_skip) return '[non-reactive object]'
    if (Array.isArray(v)) {
      var arr = []
      for (var i = 0; i < Math.min(v.length, 50); i++) arr.push(plain(v[i], depth + 1))
      if (v.length > 50) arr.push('…' + (v.length - 50) + ' more')
      return arr
    }
    var out = {}
    var keys = Object.keys(v).filter(function (k) {
      return k.charAt(0) !== '_' && k.charAt(0) !== '$'
    })
    for (var j = 0; j < Math.min(keys.length, 40); j++) out[keys[j]] = plain(v[keys[j]], depth + 1)
    return out
  }
  function refKind(r) {
    var name = r.constructor && r.constructor.name
    if (/Computed/.test(name || '')) return 'computed'
    if (Vue.isReadonly(r)) return 'readonly'
    if (Vue.isShallow && Vue.isShallow(r)) return 'shallowRef'
    return 'ref'
  }
  function snapshot(inst) {
    var out = {}
    var raw = inst.setupState ? Vue.toRaw(inst.setupState) : {}
    Object.keys(raw).forEach(function (key) {
      if (key.charAt(0) === '_' || key.charAt(0) === '$') return
      var v = raw[key]
      if (typeof v === 'function' || isComponentLike(v)) return
      if (Vue.isRef(v)) {
        out[key] = { kind: refKind(v), value: plain(v.value, 0) }
      } else if (Vue.isReactive(v) || Vue.isReadonly(v)) out[key] = { kind: Vue.isReadonly(v) ? 'readonly' : 'reactive', value: plain(v, 0) }
      else if (v === null || typeof v !== 'object') out[key] = { kind: 'const', value: plain(v, 0) }
    })
    if (inst.data && typeof inst.data === 'object') {
      Object.keys(inst.data).forEach(function (key) {
        out[key] = { kind: 'data', value: plain(inst.data[key], 0) }
      })
    }
    return out
  }
  function trackState(app) {
    if (stateStop) stateStop()
    stateStop = null
    Vue.nextTick(function () {
      var inst = app._instance
      if (!inst) return
      stateStop = Vue.watch(
        function () {
          return snapshot(inst)
        },
        function (snap) {
          onState(snap)
        },
        { immediate: true, flush: 'post' },
      )
    })
  }
  function setState(key, value) {
    var inst = apps[0] && apps[0]._instance
    if (!inst) return
    var raw = inst.setupState ? Vue.toRaw(inst.setupState) : {}
    if (Vue.isRef(raw[key]) && !Vue.isReadonly(raw[key])) raw[key].value = value
    else if (inst.data && key in inst.data) inst.data[key] = value
  }

  // ------------------------------------------------------------ mounting
  function root() {
    return doc.getElementById('app')
  }
  function unmountAll() {
    clearTimers()
    while (apps.length) {
      var a = apps.pop()
      try {
        a.unmount()
      } catch (e) {
        /* ignore */
      }
    }
    if (stateStop) {
      stateStop()
      stateStop = null
    }
    root().innerHTML = ''
  }
  function load(p) {
    project = p
    if (p.css) injectCSS(p.css)
  }
  function boot() {
    unmountAll()
    define(project.modules)
    var entry = project.entry
    if (/\.js$/.test(entry)) {
      requireModule(entry)
    } else {
      var comp = requireModule(entry).default
      if (!comp) throw new Error(entry + ' has no default export.')
      createApp(comp).mount(root())
    }
  }

  // ------------------------------------------------------------ tests
  function flush() {
    return new Promise(function (resolve) {
      setTimeout(resolve, 0)
    }).then(function () {
      return Vue.nextTick()
    })
  }
  // Structural equality that ignores object key order (like Vitest's toEqual).
  function deepEqual(a, b) {
    function eq(x, y) {
      if (Object.is(x, y)) return true
      if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) return false
      if (Array.isArray(x) !== Array.isArray(y)) return false
      if (Array.isArray(x)) {
        if (x.length !== y.length) return false
        for (var i = 0; i < x.length; i++) if (!eq(x[i], y[i])) return false
        return true
      }
      var kx = Object.keys(x).filter(function (k) { return x[k] !== undefined })
      var ky = Object.keys(y).filter(function (k) { return y[k] !== undefined })
      if (kx.length !== ky.length) return false
      for (var j = 0; j < kx.length; j++) if (!eq(x[kx[j]], y[kx[j]])) return false
      return true
    }
    try {
      return eq(Vue.toRaw(Vue.unref(a)), Vue.toRaw(Vue.unref(b))) || eq(plain(a, 0), plain(b, 0))
    } catch (e) {
      return a === b
    }
  }
  function makeExpect() {
    function build(actual, negate) {
      function check(pass, message) {
        if (negate ? pass : !pass) throw new Error((negate ? 'Expected NOT: ' : 'Expected: ') + message)
      }
      var shown = function (v) {
        return format(v)
      }
      return {
        toBe: function (e) { check(Object.is(actual, e), shown(actual) + ' to be ' + shown(e)) },
        toEqual: function (e) { check(deepEqual(actual, e), shown(actual) + ' to equal ' + shown(e)) },
        toContain: function (e) {
          var ok = actual != null && typeof actual.indexOf === 'function' && actual.indexOf(e) !== -1
          check(ok, shown(actual) + ' to contain ' + shown(e))
        },
        toMatch: function (re) { check(new RegExp(re).test(String(actual)), shown(actual) + ' to match ' + String(re)) },
        toBeTruthy: function () { check(!!actual, shown(actual) + ' to be truthy') },
        toBeFalsy: function () { check(!actual, shown(actual) + ' to be falsy') },
        toBeNull: function () { check(actual === null, shown(actual) + ' to be null') },
        toBeUndefined: function () { check(actual === undefined, shown(actual) + ' to be undefined') },
        toBeDefined: function () { check(actual !== undefined, shown(actual) + ' to be defined') },
        toBeGreaterThan: function (n) { check(actual > n, shown(actual) + ' > ' + n) },
        toBeGreaterThanOrEqual: function (n) { check(actual >= n, shown(actual) + ' >= ' + n) },
        toBeLessThan: function (n) { check(actual < n, shown(actual) + ' < ' + n) },
        toBeLessThanOrEqual: function (n) { check(actual <= n, shown(actual) + ' <= ' + n) },
        toHaveLength: function (n) { check(actual != null && actual.length === n, shown(actual) + ' to have length ' + n + ' (got ' + (actual && actual.length) + ')') },
        toThrow: function () {
          var threw = false
          try {
            actual()
          } catch (e) {
            threw = true
          }
          check(threw, 'function to throw')
        },
      }
    }
    return function expect(actual) {
      var api = build(actual, false)
      api.not = build(actual, true)
      return api
    }
  }
  function helpers() {
    function q(sel) {
      var el = typeof sel === 'string' ? root().querySelector(sel) : sel
      if (!el) throw new Error('No element matches "' + sel + '"')
      return el
    }
    function visible(el) {
      if (!el || !el.isConnected) return false
      var win = doc.defaultView
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (n.hidden) return false
        var cs = win.getComputedStyle(n)
        if (cs.display === 'none' || cs.visibility === 'hidden') return false
      }
      return true
    }
    var win = doc.defaultView
    var h = {
      expect: makeExpect(),
      nextTick: function () { return Vue.nextTick() },
      flush: flush,
      wait: function (ms) { return new Promise(function (r) { setTimeout(r, ms) }).then(flush) },
      find: function (sel) { return root().querySelector(sel) },
      // Teleported content lives outside #app — query the whole document.
      query: function (sel) { return doc.querySelector(sel) },
      queryAll: function (sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)) },
      findAll: function (sel) { return Array.prototype.slice.call(root().querySelectorAll(sel)) },
      exists: function (sel) { return !!root().querySelector(sel) },
      isVisible: function (sel) { return visible(typeof sel === 'string' ? root().querySelector(sel) : sel) },
      text: function (sel) { return (sel ? q(sel) : root()).textContent.replace(/\s+/g, ' ').trim() },
      html: function (sel) { return (sel ? q(sel) : root()).innerHTML },
      attr: function (sel, name) { return q(sel).getAttribute(name) },
      classes: function (sel) { return Array.prototype.slice.call(q(sel).classList) },
      click: function (sel) {
        var el = q(sel)
        if (typeof el.focus === 'function') el.focus() // a real click focuses buttons and inputs
        el.dispatchEvent(new win.MouseEvent('click', { bubbles: true, cancelable: true }))
        return flush()
      },
      clickAll: function (sel, times) {
        var p = Promise.resolve()
        for (var i = 0; i < (times || 1); i++) p = p.then(function () { return h.click(sel) })
        return p
      },
      type: function (sel, value) {
        var el = q(sel)
        el.value = value
        el.dispatchEvent(new win.Event('input', { bubbles: true }))
        el.dispatchEvent(new win.Event('change', { bubbles: true }))
        return flush()
      },
      check: function (sel, on) {
        var el = q(sel)
        el.checked = on === undefined ? !el.checked : !!on
        el.dispatchEvent(new win.Event('change', { bubbles: true }))
        return flush()
      },
      select: function (sel, value) {
        var el = q(sel)
        el.value = value
        el.dispatchEvent(new win.Event('change', { bubbles: true }))
        return flush()
      },
      trigger: function (sel, type, init) {
        var el = q(sel)
        var ev = /^key/.test(type)
          ? new win.KeyboardEvent(type, Object.assign({ bubbles: true, cancelable: true }, init || {}))
          : new win.Event(type, Object.assign({ bubbles: true, cancelable: true }, init || {}))
        el.dispatchEvent(ev)
        return flush()
      },
      submit: function (sel) {
        var el = q(sel || 'form')
        el.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }))
        return flush()
      },
      requireModule: function (id) { return requireModule(id) },
      withSetup: function (fn) {
        var result
        var app = createApp({ setup: function () { result = fn(); return function () { return null } } })
        app.mount(doc.createElement('div'))
        return result
      },
      mountFile: function (id, props) {
        var C = requireModule(id).default
        var events = []
        var names = Array.isArray(C.emits) ? C.emits : Object.keys(C.emits || {})
        var state = Vue.reactive(Object.assign({}, props || {}))
        var listeners = {}
        names.forEach(function (n) {
          listeners[Vue.toHandlerKey(Vue.camelize(n))] = function () {
            events.push({ name: n, args: Array.prototype.slice.call(arguments) })
            if (n.indexOf('update:') === 0) state[n.slice(7)] = arguments[0]
          }
        })
        var host = doc.createElement('div')
        root().appendChild(host)
        createApp({ render: function () { return Vue.h(C, Object.assign({}, state, listeners)) } }).mount(host)
        return {
          el: host,
          text: function () { return host.textContent.replace(/\s+/g, ' ').trim() },
          find: function (sel) { return host.querySelector(sel) },
          emitted: function (name) {
            return events.filter(function (e) { return e.name === name }).map(function (e) { return e.args })
          },
          setProps: function (p) { Object.assign(state, p); return flush() },
          props: state,
        }
      },
    }
    return h
  }
  function runOne(test) {
    var logs = []
    currentLogs = logs
    var started = Date.now()
    var timer
    return Promise.resolve()
      .then(function () {
        // Every test starts from clean storage, in the browser and in CI alike.
        try {
          doc.defaultView.localStorage.clear()
          doc.defaultView.sessionStorage.clear()
        } catch (e) {
          /* storage unavailable */
        }
        boot()
        return flush()
      })
      .then(function () {
        var h = helpers()
        h.logs = logs
        var inst = apps[0] && apps[0]._instance
        h.state = inst ? inst.setupState : {}
        h.vm = inst ? inst.proxy : null
        var names = Object.keys(h)
        var args = names.map(function (n) { return h[n] })
        var fn = new Function(names.join(','), '"use strict"; return (async () => {\n' + test.code + '\n})()')
        var timeout = new Promise(function (_, reject) {
          timer = setTimeout(function () { reject(new Error('Test timed out after 4s')) }, 4000)
        })
        return Promise.race([fn.apply(null, args), timeout])
      })
      .then(
        function () {
          return { name: test.name, pass: true, ms: Date.now() - started }
        },
        function (e) {
          return { name: test.name, pass: false, error: e && e.message ? e.message : String(e), ms: Date.now() - started }
        },
      )
      .then(function (r) {
        clearTimeout(timer)
        currentLogs = null
        return r
      })
  }
  function runTests(tests) {
    var results = []
    var chain = Promise.resolve()
    tests.forEach(function (t) {
      chain = chain.then(function () {
        return runOne(t).then(function (r) { results.push(r) })
      })
    })
    return chain.then(function () {
      return results
    })
  }

  return {
    load: load,
    boot: boot,
    runTests: runTests,
    setState: setState,
    unmountAll: unmountAll,
    format: format,
    formatArgs: formatArgs,
    recordLog: recordLog,
  }
}
