import libs from 'virtual:sandbox-libs'
import coreSource from './core.js?raw'
import runtimeSource from './runtime.js?raw'

const BASE_CSS = `
  :root { color-scheme: light; }
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1a1a1a; background: #fff; }
  button { font: inherit; padding: 6px 14px; border: 2px solid #1a1a1a; background: #dcff1e; color: #1a1a1a; font-weight: 700; cursor: pointer; box-shadow: 2px 2px 0 #1a1a1a; }
  button:active { transform: translate(2px, 2px); box-shadow: none; }
  button:disabled { opacity: .5; cursor: not-allowed; }
  input, select, textarea { font: inherit; padding: 6px 8px; border: 2px solid #1a1a1a; }
  input[type=checkbox], input[type=radio] { width: auto; }
  h1, h2, h3 { line-height: 1.15; margin: 0 0 .5em; }
  ul { padding-left: 1.2em; }
  :focus-visible { outline: 3px solid #1d3bf0; outline-offset: 2px; }
`

const escapeAttr = (s) => s.replace(/"/g, '&quot;')

/** Builds the iframe document. `externals` lists which libraries the project imports. */
export function buildSrcdoc(externals = ['vue']) {
  const origin = typeof location !== 'undefined' ? location.origin : ''
  const scripts = ['vue', 'pinia', 'vue-router']
    .filter((k) => k === 'vue' || externals.includes(k))
    .map((k) => `<script src="${escapeAttr(origin + libs[k].url)}"></script>`)
    .join('\n')
  // `</script` inside the runtime would end the inline script early.
  const runtime = (coreSource + '\n' + runtimeSource).replace(/<\/script/gi, '<\\/script')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${BASE_CSS}</style>
${scripts}
<script>${runtime}</script>
</head>
<body><div id="app"></div></body>
</html>`
}

export const sandboxVersions = Object.fromEntries(Object.entries(libs).map(([k, v]) => [k, v.version]))
