/**
 * changeNotifier.js — the bridge between product WRITES and the live push.
 *
 * The server no longer watches MongoDB with a change stream (removed 2026-08-02
 * after it leaked one pool connection per Atlas reconnect, three incidents in
 * three months — see CLAUDE.md STATUS). Instead the API write path calls
 * notifyProductChange(), and core.js registers what that does: clear the
 * category caches and broadcast to open WebSocket tabs.
 *
 * This module exists only to break the require cycle
 * core.js -> routes -> productController -> core.js.
 */
let impl = null;

// core.js calls this once, after the WebSocket broadcasts are created.
function registerProductChangeNotifier(fn) {
  impl = fn;
}

// Controllers call this after a successful product write. Fire-and-forget:
// never awaited on the request path, and never throws into the caller.
function notifyProductChange(productId = null) {
  if (!impl) return;
  Promise.resolve(impl(productId)).catch((err) =>
    console.error("❌ Product change notification failed:", err.message)
  );
}

module.exports = { registerProductChangeNotifier, notifyProductChange };
