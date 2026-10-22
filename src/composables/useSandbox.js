import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { compileFiles } from '../services/sandbox/compilerClient.js'
import { buildSrcdoc } from '../services/sandbox/srcdoc.js'

let logSeq = 0
const START_TIMEOUT = 10_000

/**
 * Runs playground projects inside a sandboxed iframe.
 *
 * Bind `iframe` to an <iframe sandbox="allow-scripts ..."> element. Each run
 * compiles in the worker, then reloads the iframe with a fresh document so no
 * state leaks between runs.
 */
export function useSandbox() {
  const iframe = shallowRef(null)
  const status = ref('idle') // idle | compiling | loading | running | testing | error
  const logs = ref([]) // { id, level, text, count }
  const compileErrors = ref([])
  const state = ref(null)
  const testResults = ref(null)
  const lastRunAt = ref(0)

  let pending = null
  let startTimer = null

  function pushLog(level, text) {
    const last = logs.value[logs.value.length - 1]
    if (last && last.level === level && last.text === text) {
      last.count++
      return
    }
    logs.value.push({ id: ++logSeq, level, text, count: 1 })
    if (logs.value.length > 300) logs.value.splice(0, logs.value.length - 300)
  }

  function settle(value) {
    clearTimeout(startTimer)
    const p = pending
    pending = null
    p?.resolve(value)
  }

  function onMessage(e) {
    const el = iframe.value
    if (!el || e.source !== el.contentWindow) return
    const msg = e.data
    if (!msg || msg.__sandbox !== true) return
    switch (msg.type) {
      case 'ready': {
        clearTimeout(startTimer)
        if (!pending) return
        if (!msg.vue) {
          pushLog('error', 'Vue failed to load inside the sandbox. Check your connection and run again.')
          status.value = 'error'
          return settle({ ok: false })
        }
        const { result, mode, tests } = pending
        status.value = mode === 'test' ? 'testing' : 'loading'
        el.contentWindow.postMessage(
          { type: 'run', modules: result.modules, css: result.css, entry: result.entry, mode, tests },
          '*',
        )
        break
      }
      case 'console':
        pushLog(msg.level, msg.args.join(' '))
        break
      case 'console-clear':
        logs.value = []
        break
      case 'state':
        state.value = msg.state
        break
      case 'status':
        status.value = msg.status === 'mounted' ? 'running' : 'error'
        if (pending?.mode === 'app') settle({ ok: msg.status === 'mounted' })
        break
      case 'test-results':
        testResults.value = msg.results
        status.value = 'running'
        settle({ ok: true, results: msg.results })
        break
    }
  }

  window.addEventListener('message', onMessage)
  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    clearTimeout(startTimer)
  })

  /**
   * @param {Record<string,string>} files
   * @param {{ entry?: string, mode?: 'app'|'test', tests?: {name:string, code:string}[] }} opts
   * @returns {Promise<{ ok: boolean, results?: any[], errors?: any[] }>}
   */
  async function run(files, { entry, mode = 'app', tests = [] } = {}) {
    if (pending) settle({ ok: false, superseded: true })
    status.value = 'compiling'
    logs.value = []
    compileErrors.value = []
    state.value = null
    if (mode === 'test') testResults.value = null
    lastRunAt.value = Date.now()

    const result = await compileFiles(files, entry)
    if (result.errors.length) {
      compileErrors.value = result.errors
      for (const err of result.errors) pushLog('error', `${err.file ? err.file + ': ' : ''}${err.message}`)
      status.value = 'error'
      if (mode === 'test') {
        testResults.value = [{ name: 'Compile', pass: false, error: 'Your code has a compile error — see the console.' }]
      }
      return { ok: false, errors: result.errors, results: testResults.value }
    }
    const el = iframe.value
    if (!el) return { ok: false }

    return new Promise((resolve) => {
      pending = { result, mode, tests, resolve }
      startTimer = setTimeout(() => {
        pushLog('error', 'The sandbox did not start within 10 seconds.')
        status.value = 'error'
        settle({ ok: false })
      }, START_TIMEOUT)
      el.srcdoc = buildSrcdoc(result.externals)
    })
  }

  function setState(key, value) {
    iframe.value?.contentWindow?.postMessage({ type: 'set-state', key, value }, '*')
  }

  function clearLogs() {
    logs.value = []
  }

  return { iframe, status, logs, compileErrors, state, testResults, lastRunAt, run, setState, clearLogs }
}
