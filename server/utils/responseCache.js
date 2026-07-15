/**
 * responseCache.js — tiny in-memory cache with single-flight (request coalescing).
 *
 * Why this exists: under load (e.g. a crawler walking the category tree) many
 * concurrent requests hit the same expensive read endpoint. Each one was
 * launching its own full-collection scan + JSON.stringify on the single
 * 0.5-CPU process, so everything queued head-of-line and backed up to 90-120s.
 *
 * singleFlight() collapses N concurrent identical requests into ONE underlying
 * operation whose result is shared, then caches it for a short TTL. A 50-request
 * stampede becomes one Mongo op + one serialization served to all 50.
 *
 * Sizing: products:all and site-stats are single slots, but category:<name>,
 * seo:<name> and product:<id> are one key per distinct value, so the Map scales
 * with catalog size (and, for keys derived from the URL, with whatever a crawler
 * asks for). All products serialized together are ~300KB, so the product: family
 * is small in absolute terms — but this is NOT a fixed key set. Entries evict
 * lazily on access, with no periodic sweep and no max size. `size()` is surfaced
 * as cacheKeys in the [STALL]/[HEALTH-WARN] lines; if it ever climbs into the
 * tens of thousands, add a sweep + max-size eviction.
 */

const store = new Map(); // key -> { value, expires }
const inflight = new Map(); // key -> Promise

// Return a fresh cached value, or undefined if missing/expired.
// Note: a cached `null` is a valid hit (used for negative caching of 404s).
function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

function clear(key) {
  store.delete(key);
  inflight.delete(key);
}

// Drop every cached key starting with `prefix` (e.g. "category:" on a write).
function clearPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

/**
 * Return a fresh cached value if present; otherwise run producer() — but only
 * ONE producer runs per key at a time. Concurrent callers await the same
 * promise. The resolved value is cached for ttlMs. Rejections are not cached.
 */
async function singleFlight(key, ttlMs, producer) {
  const cached = get(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const value = await producer();
    set(key, value, ttlMs);
    return value;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

// Current number of cached keys — surfaced in [STALL]/[HEALTH-WARN] lines so an
// unbounded-growth incident records its own cache size.
function size() {
  return store.size;
}

module.exports = { get, set, clear, clearPrefix, singleFlight, size };
