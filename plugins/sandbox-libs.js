// Serves the browser builds the code sandbox loads inside its iframe.
// Dev: a middleware streams them from node_modules. Build: they are emitted as
// versioned static assets. Either way the app reads the URLs from
// `virtual:sandbox-libs`, so the iframe always runs the same Vue version the
// app was built with.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function pkgDir(name) {
  // pinia does not expose package.json subpaths for dist files, so resolve the
  // package root from its package.json (which every package exports).
  return path.dirname(require.resolve(`${name}/package.json`))
}

function libs() {
  const defs = [
    { key: 'vue', pkg: 'vue', file: 'dist/vue.global.js' },
    { key: 'pinia', pkg: 'pinia', file: 'dist/pinia.iife.js' },
    { key: 'vue-router', pkg: 'vue-router', file: 'dist/vue-router.global.js' },
  ]
  return defs.map((d) => {
    const dir = pkgDir(d.pkg)
    const version = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version
    return {
      ...d,
      version,
      abs: path.join(dir, d.file),
      url: `/sandbox-libs/${d.key}@${version}.js`,
    }
  })
}

export function sandboxLibs() {
  const VIRTUAL_ID = 'virtual:sandbox-libs'
  const RESOLVED = '\0' + VIRTUAL_ID
  let list = []
  let base = '/'

  return {
    name: 'sandbox-libs',
    configResolved(config) {
      base = config.base || '/'
      list = libs()
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      const map = Object.fromEntries(
        list.map((l) => [l.key, { url: base.replace(/\/$/, '') + l.url, version: l.version }]),
      )
      return `export default ${JSON.stringify(map)}`
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0]
        const hit = list.find((l) => url === l.url || url === base.replace(/\/$/, '') + l.url)
        if (!hit) return next()
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        fs.createReadStream(hit.abs).pipe(res)
      })
    },
    generateBundle() {
      for (const l of list) {
        this.emitFile({
          type: 'asset',
          fileName: l.url.slice(1),
          source: fs.readFileSync(l.abs, 'utf8'),
        })
      }
    },
  }
}
