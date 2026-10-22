// The browser build of @vue/compiler-sfc references `window` in its source-map
// helpers. Workers have no `window`, so alias it to the worker global.
if (typeof self !== 'undefined' && typeof self.window === 'undefined') {
  self.window = self
}
