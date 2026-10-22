// Static syntax highlighting using the same Lezer parsers and token classes as
// the CodeMirror editor, so read-only code and editable code look identical.
// Parsers load lazily the first time a code block renders.
import { classHighlighter, highlightTree } from '@lezer/highlight'

let languagesPromise = null

function loadLanguages() {
  languagesPromise ??= Promise.all([
    import('@codemirror/lang-javascript'),
    import('@codemirror/lang-vue'),
    import('@codemirror/lang-html'),
    import('@codemirror/lang-css'),
  ]).then(([js, vue, html, css]) => ({
    js: js.javascriptLanguage,
    jsx: js.jsxLanguage,
    ts: js.typescriptLanguage,
    tsx: js.tsxLanguage,
    vue: vue.vueLanguage,
    html: html.htmlLanguage,
    css: css.cssLanguage,
  }))
  return languagesPromise
}

const ALIASES = {
  javascript: 'js',
  mjs: 'js',
  json: 'js',
  typescript: 'ts',
  htm: 'html',
  vue: 'vue',
}

export function normalizeLang(lang = '') {
  const l = lang.toLowerCase()
  return ALIASES[l] ?? l
}

/**
 * Returns lines of tokens: [[{ text, cls }], ...]. Unknown languages come back
 * as plain text lines.
 */
export async function highlightLines(code, lang) {
  const key = normalizeLang(lang)
  const langs = await loadLanguages()
  const language = langs[key]
  const lines = [[]]
  const push = (text, cls) => {
    const parts = text.split('\n')
    parts.forEach((part, i) => {
      if (i > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ text: part, cls })
    })
  }
  if (!language) {
    push(code, '')
    return lines
  }
  const tree = language.parser.parse(code)
  let pos = 0
  highlightTree(tree, classHighlighter, (from, to, cls) => {
    if (from > pos) push(code.slice(pos, from), '')
    push(code.slice(from, to), cls)
    pos = to
  })
  if (pos < code.length) push(code.slice(pos), '')
  return lines
}

export function plainLines(code) {
  return code.split('\n').map((text) => (text ? [{ text, cls: '' }] : []))
}
