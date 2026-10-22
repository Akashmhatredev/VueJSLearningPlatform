/* eslint-disable */
// Sandbox runtime glue — runs INSIDE the sandboxed iframe (opaque origin, no
// access to the app's storage or DOM). Inlined into srcdoc after core.js.
// Talks to the parent only through postMessage.
;(function () {
  'use strict'
  var parentWin = window.parent
  var core = null

  function post(msg) {
    msg.__sandbox = true
    try {
      parentWin.postMessage(msg, '*')
    } catch (e) {
      /* the parent went away */
    }
  }

  // Opaque-origin iframes cannot use Web Storage. Provide an in-memory stand-in
  // so storage examples work (it resets on every run).
  function memoryStorage() {
    var data = Object.create(null)
    return {
      get length() { return Object.keys(data).length },
      key: function (i) { return Object.keys(data)[i] ?? null },
      getItem: function (k) { return k in data ? data[k] : null },
      setItem: function (k, v) { data[k] = String(v) },
      removeItem: function (k) { delete data[k] },
      clear: function () { data = Object.create(null) },
    }
  }
  ;['localStorage', 'sessionStorage'].forEach(function (name) {
    try {
      void window[name].length
    } catch (e) {
      try {
        Object.defineProperty(window, name, { value: memoryStorage(), configurable: true })
      } catch (e2) {
        /* leave it */
      }
    }
  })

  var native = {}
  // Console output: record it for tests' `logs`, then show it in the console panel.
  function send(level, args) {
    var out = core ? core.formatArgs(args) : args.map(String)
    if (core) core.recordLog(out.join(' '))
    post({ type: 'console', level: level, args: out })
  }
  // Vue errors/warnings: the core already recorded them, so only show them.
  function show(level, args) {
    post({ type: 'console', level: level, args: args.map(String) })
  }
  ;['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    native[level] = console[level]
    console[level] = function () {
      send(level, Array.prototype.slice.call(arguments))
      if (native[level]) native[level].apply(console, arguments)
    }
  })
  console.table = function (data) {
    send('log', [data])
  }
  console.clear = function () {
    post({ type: 'console-clear' })
  }

  window.addEventListener('error', function (e) {
    var where = e.filename && e.filename !== 'about:srcdoc' ? ' (' + e.filename.replace(/.*\//, '') + (e.lineno ? ':' + e.lineno : '') + ')' : ''
    send('error', ['Uncaught ' + (e.error ? e.error.name + ': ' + e.error.message : e.message) + where])
  })
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason
    send('error', ['Unhandled promise rejection: ' + (r && r.message ? r.message : String(r))])
  })
  // A form submitted without .prevent would navigate the iframe away.
  window.addEventListener('submit', function (e) {
    if (!e.defaultPrevented) {
      e.preventDefault()
      send('warn', ['A <form> was submitted without preventDefault — in a real page this reloads the page. Use @submit.prevent.'])
    }
  })
  // Links inside examples should not navigate the sandbox away.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null
    if (a && !e.defaultPrevented) {
      var href = a.getAttribute('href') || ''
      if (href && href.charAt(0) !== '#') {
        e.preventDefault()
        send('info', ['Navigation to "' + href + '" was blocked inside the sandbox.'])
      }
    }
  })

  if (window.Vue) {
    core = createSandboxCore({
      Vue: window.Vue,
      document: document,
      externals: { pinia: window.Pinia, 'vue-router': window.VueRouter },
      log: show,
      onState: function (snap) {
        post({ type: 'state', state: snap })
      },
    })
  }

  window.addEventListener('message', function (e) {
    if (e.source !== parentWin || !core) return
    var msg = e.data || {}
    if (msg.type === 'run') {
      core.load(msg)
      if (msg.mode === 'test') {
        core.runTests(msg.tests || []).then(
          function (results) {
            post({ type: 'test-results', results: results })
          },
          function (err) {
            post({ type: 'test-results', results: [{ name: 'Test runner', pass: false, error: err.message }] })
          },
        )
        return
      }
      try {
        core.boot()
        post({ type: 'status', status: 'mounted' })
      } catch (err) {
        send('error', [err && err.name ? err.name + ': ' + err.message : String(err)])
        post({ type: 'status', status: 'error' })
      }
    } else if (msg.type === 'set-state') {
      core.setState(msg.key, msg.value)
    }
  })

  post({ type: 'ready', vue: window.Vue && window.Vue.version })
})()
