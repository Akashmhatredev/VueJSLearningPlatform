// Runs playground projects and their tests inside Vitest's jsdom, using the
// exact same sandbox core the browser iframe uses.
import * as sfc from 'vue/compiler-sfc'
import * as Vue from 'vue'
import * as Pinia from 'pinia'
import * as VueRouter from 'vue-router'
import coreSource from '../../src/services/sandbox/core.js?raw'
import { compileProject } from '../../src/services/sandbox/compile.js'

// eslint-disable-next-line no-new-func
const createSandboxCore = new Function(`${coreSource}\nreturn createSandboxCore`)()

export async function compile(files, entry) {
  return compileProject(files, sfc, { entry })
}

export async function runProjectTests(files, tests, entry) {
  const compiled = await compile(files, entry)
  if (compiled.errors.length) return { compileErrors: compiled.errors, results: [] }

  document.head.querySelectorAll('style[data-sandbox-module]').forEach((n) => n.remove())
  document.body.innerHTML = '<div id="app"></div>'
  const logs = []
  const core = createSandboxCore({
    Vue,
    document,
    externals: { pinia: Pinia, 'vue-router': VueRouter },
    log: (level, args) => logs.push(`[${level}] ${args.join(' ')}`),
  })
  const original = {}
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    original[level] = console[level]
    console[level] = (...args) => {
      const text = core.formatArgs(args).join(' ')
      core.recordLog(text)
      logs.push(`[${level}] ${text}`)
    }
  }
  try {
    core.load({ modules: compiled.modules, css: compiled.css, entry: compiled.entry })
    const results = await core.runTests(tests)
    return { results, logs }
  } finally {
    core.unmountAll()
    Object.assign(console, original)
  }
}
