# CLAUDE.md — runbook for the recurring "data not loading" issue

This file exists because **the same problem keeps coming back every couple of months**. Read it before suggesting changes — most of the obvious moves have already been tried, and there are infra constraints that rule out the easy answers.

## STATUS — 2026-07-15: THE SYMPTOM HAS TWO DIFFERENT CAUSES (READ THIS FIRST)

**The single most important thing in this file:** "clicking a single product hangs" has now been traced to **two unrelated causes**. The symptom is identical both times. **Never diagnose this from the symptom — always read the logs first.** The 2026-06-18 fix was correct and is still working; the 2026-07-15 recurrence was something else entirely, and assuming otherwise would have wasted the session.

| Cause | Signature | Status |
|---|---|---|
| **CPU head-of-line blocking** | `[STALL]` present, `[HEALTH] loop=p99` high | Fixed `a2cba64` (2026-06-18). Verified still working 2026-07-15: `getAll` cache hit = 0.43s. |
| **Mongo-side latency** | **No `[STALL]`**, `loop` calm, CPU ~0%, requests still 10-20s | Fixed 2026-07-15 (this session) — see below. |

### 2026-07-15 — recurrence diagnosed: Mongo-side, NOT the app

Evidence from a live slow window (the incident recorder from `5d68fe7` did its job — the discriminator it was built for worked exactly as designed):
- Render **CPU flat ~0-5%** of the 0.5 limit for 12h; heap flat ~90MB; uptime 644h (no restart).
- `[HEALTH] loop=p99:23ms/max:194ms` — the event loop is **never blocked**.
- **Zero `[STALL]`, zero `[BROADCAST]`, zero `[HEALTH-WARN]`** while requests took 10-20s. The recorder was alive (`[HEALTH]` lines printing, same fn starts both) — the silence was real evidence, not a dead sensor.
- Decisive test: `/health` (no Mongo) rock-steady **0.31s**, while an identical indexed `findById` swung **0.4s → 15.9s**. The process was *idle-waiting on Mongo*, not working.

**Root cause: `getProduct` was the only hot read `a2cba64` never cached** — a bare `Product.findById(id).lean()`, i.e. exactly the endpoint the symptom names. Every product page SSR hit it uncached, and Next's default prefetch-on-viewport fanned out ~10 concurrent full page renders per category grid, each fetching the product **twice** (generateMetadata + page). That op rate saturated the M0 shared tier; once M0 is saturated *everything* Mongo-backed goes slow, including trivial lookups.

**What shipped 2026-07-15** (server-side is the load-bearing fix; the web changes cut the load that caused it):
- `productController.js` — `getProduct` now uses `cache.singleFlight("product:<id>")` with the 60s TTL. Verified: 10 concurrent requests → **1 Mongo op**. Note `"product:"` does NOT prefix-match `"products:all"`, so both are cleared separately.
- `ProductCard.tsx` — `prefetch={false}`, cutting ~10 speculative SSRs per category grid to 1 on click.
- `product/[productIdSlug]/page.tsx` — React `cache()` dedupes the double product fetch (`fetch` uses `no-store`, which opts out of Next's own dedupe).
- `sitemap.ts` — data cached via `unstable_cache({revalidate:3600})`. **`force-dynamic` must stay**: the Render build runs before the server exists, so a static sitemap would fetch a dead API. The old route-level `revalidate` was dead code under `force-dynamic`.
- `websocket.ts` — `reconnectAttempts` reset only after 30s of stability (it was reset in `onopen`, so a socket that opened then died reset the counter every cycle → endless 1s reconnect loop, backoff never grew, `maxReconnectAttempts` unreachable). Also no longer reconnects on a clean 1000 close.

**Still unconfirmed:** M0 saturation is inferred, not proven — what's *proven* is erratic Mongo latency while the app idles. If it recurs with a calm loop, check Atlas Metrics (Operation Execution Time, Connections vs the 500 cap) to confirm.

### The older 2026-06-18 finding (still valid)

The "redeploy fixes it for weeks" framing further down pointed at **runtime state drift / heap growth (H1)**. **That was wrong.** A 35-day production `[HEALTH]` trace showed heap dead-flat at ~95MB (cap 460MB) with no restarts — no leak, no drift. **H1 is disproven; do not re-chase it.** (Re-confirmed 2026-07-15.)

**Actual root cause: load-induced head-of-line blocking on the single 0.5-CPU process.** Under a crawler walking the category tree, every hot read endpoint did a full-collection scan + synchronous `JSON.stringify` (and the regex category query forces a COLLSCAN). On half a CPU these serialize through one event loop, so requests pile up and release in *waves* — even a trivial indexed `findById` took 30–120s. It is congestion **under load**, not slow accumulation; "redeploy fixes it" merely drops the queued work. Confirmed fixed in prod: the same requests went **36,000ms → 36ms**.

### What shipped (newest first) — all live on `main`
- `5d68fe7` — **Incident recorder.** New `[STALL]`, `[HEALTH-WARN]`, `[BROADCAST]` logs so a recurrence records its own cause (see the log table). The `[HEALTH]` line gained `rss` and `loop=p99/max` (event-loop delay).
- `5be5508` — **Dependabot remediation.** All prod-relevant criticals/highs cleared (`npm audit fix` in `server/` + `web/`; `next`→14.2.35; `jspdf`→4.2.1).
- `197e747` — **Change stream fixed.** It had watched collection `"products"` but data lives in `"test"`, so it never fired. Now uses `Product.watch()` and invalidates the response cache on change. NOTE: this **re-activated H2 broadcasts** (see Still open).
- `a2cba64` — **The fix.** Single-flight + short-TTL response cache (`server/utils/responseCache.js`) on getAll, category, nav, site-stats, seo-text. N concurrent identical requests collapse to one Mongo op + one serialize. This resolved the slowness.

### Decision rule when it feels slow again
Open Render logs and grep for `STALL`, `HEALTH-WARN`, `BROADCAST`, then `SLOW`:
- A `[STALL]` / `[HEALTH-WARN]` / `[BROADCAST]` line → it **names the cause** (in-flight request, broadcast state, memory, mongo, `cacheKeys`). Fix that.
- **`[REQ] … SLOW` lines but NO `[STALL]`** → the event loop is calm, so the process is **idle-waiting on I/O, not working**. This is the 2026-07-15 signature: **Mongo-side**. Confirm in 10 seconds with the `/health` test below, then look for an uncached Mongo op on the slow path. Do NOT go chasing CPU/event-loop work — CPU will be ~0%.
- **Nothing** in any of them but it's slow → probably not the app (CDN / Render platform / network / frontend cache) — **but run the `/health` test before concluding that.** An earlier version of this rule sent you straight upstream here, and in 2026-07-15 that would have been wrong: the logs were silent because nothing was blocked, yet the cause was still server-side (Mongo).

### The 10-second discriminator: is it Node or Mongo?

`/health` (`core.js`) returns a static string and never touches Mongo. Compare it against any Mongo-backed endpoint:

```bash
URL=https://hybrid-app-1-2haj.onrender.com
for i in 1 2 3; do curl -s -o /dev/null -w "health   %{time_total}s\n" "$URL/health"; done
for i in 1 2 3; do curl -s -o /dev/null -w "product  %{time_total}s\n" "$URL/api/products/<some-id>"; done
```

- **`/health` fast + Mongo endpoint slow** → the process is healthy; it's **Mongo**. (2026-07-15: 0.31s vs 15.9s.)
- **Both slow** → the process/network really is the bottleneck; go back to the `[STALL]` trail.

### Still open / deferred (a new session can pick these up)
- **Broadcast debounce (server-only).** Still unimplemented, but **downgraded**: a 1h log sweep on 2026-07-15 during live slowness found **zero `[BROADCAST]` lines**, so this path was not firing at all and is *not* what causes the recurrence. Only act if `[BROADCAST]` lines actually cluster (i.e. during a real bulk product update); then coalesce a burst into one rebuild after ~1-2s of quiet.
- **Bounded cache — now more relevant.** `responseCache` evicts lazily (on access) with no size cap. As of 2026-07-15 it also holds `product:<id>`, one key per product, on top of `category:` / `seo:<name>`. Absolute size is still small (all products serialize to ~300KB), but the key set is **not** fixed. Watch `cacheKeys` in `[STALL]` / `[HEALTH-WARN]`; if it climbs into the tens of thousands, add a periodic sweep + max-size eviction.
- **Self-referential HTTP (not yet fixed).** `NEXT_PUBLIC_API_URL` points at the public domain, so Next server components fetch the Express API by going **out to Render's edge and back into the same process** (`combined.js` serves both). Every SSR data fetch pays a full public round-trip. Pointing it at `http://127.0.0.1:$PORT` — or calling the controllers in-process — would remove that. Left alone 2026-07-15 because `NEXT_PUBLIC_*` is inlined at build time and CPU was not the bottleneck; revisit if CPU ever is.
- **The local `web` build fails without env vars.** `npm run build` in `web/` exits 1 on a clean tree with 51× Firebase `auth/invalid-api-key` — the prerender of client pages needs the Firebase env. Render has them, so it builds fine there. Don't panic at a red local build; compare against a stashed baseline before blaming your changes.
- **Next 15 migration.** The only prod vuln residual (image-optimizer / RSC DoS highs) is patched only in Next 15 — a deliberate major upgrade, deferred.
- **`firebase-admin` 13→14** (clears the google-cloud moderate chain) and **dev-only vuln tooling** (concurrently/shell-quote, eslint 9, glob) — deferred, not prod runtime.

## Project at a glance

- **Stack:** Node/Express + MongoDB (Mongoose) + Next.js + Redux + native WebSocket (`ws`).
- **Layout:**
  - `server/` — API + WebSocket. Entry points: `server/server.js` (dev), `server/combined.js` (prod). Shared logic in `server/core.js`.
  - `web/` — Next.js frontend.
- **Production:** single Render web service serves API + Next.js on one port (saves money). See `render.yaml`.

## Infrastructure constraints (DO NOT IGNORE)

| Thing | Value | Implication |
|---|---|---|
| Render plan | `starter` ($7/mo) | 512MB RAM, 0.5 CPU, **does not** spin down |
| Node heap cap | 460MB (`NODE_OPTIONS=--max-old-space-size=460`) | Only ~52MB headroom before OOM |
| MongoDB Atlas | **M0 free tier** | Shared CPU/RAM, 500-conn cap, throttles under sustained load |
| Render proxy | 1 hop | `app.set('trust proxy', 1)` — keep it `1`, never `true` |

**User has said no to upgrades.** Do not propose plan upgrades as the primary fix. If you genuinely believe an upgrade is required, say so explicitly as a last resort, not the first suggestion.

## The recurring symptom

- Categories load fine (cached server-side for 5 min, client localStorage for 5 min)
- Product list loads (mostly)
- **Clicking a single product is slow or hangs**
- **Redeploying fixes it for weeks-to-months**, then it returns

> ⚠️ **This paragraph was the original theory and is now DISPROVEN — see STATUS at the top.** It read: *the "redeploy fixes it" fingerprint means runtime state drift (heap growth, stale connections, stacked timers, rate-limit buckets).* The 35-day flat-heap trace killed that. The real cause is **load-induced head-of-line blocking** on the single 0.5-CPU process, fixed in `a2cba64`. Kept here so nobody re-derives the wrong hypothesis. Still true: it is **not** a static code bug, **not** Render cold-start, **not** Atlas auto-pause.

## What has already been done (don't re-suggest)

Commits in chronological order (newest at top):

- `c66cdc7` — `app.set('trust proxy', 1)` so `req.ip` is the real client behind Render's edge. Killed the `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` log spam and made rate limiters effective.
- `15e91cf` — `broadcastCategoriesUpdate` now uses lightweight `getCategoriesNav` instead of the heavy `buildCategoryStructure` that embedded every product into the category tree on every change-stream event. Also added `retryScheduled` guard so `error`+`close` events can't stack `setTimeout` retries.
- `7aebe32` — Diagnostic logging: `[REQ]` middleware for slow/error responses with Mongo state and timing; `[REQ-ERR]` full stacks in product controllers; `.lean()` on `getProduct`; Mongo connected log shows `host/db`.
- `074c8a9` — Original stale-connection fix: `maxIdleTimeMS: 30000`, await DB before serving, health diagnostics every 30 min (`[HEALTH]` log).

## When the issue returns — diagnostic runbook

### Step 1 — Open Render logs

Dashboard: https://dashboard.render.com → the web service → **Logs** tab.

Filter to the time window of a confirmed slow click.

### Step 2 — Find the request

Look for a `[REQ]` line matching the slow request, e.g.

```
[REQ] GET /api/products/<id> 200 14820ms mongo=connected SLOW
```

(The middleware only logs requests that are slow >1000ms, error >= 400, or any request in dev.)

Three possible signatures:

| Signature | Likely cause | Where to look next |
|---|---|---|
| High `ms`, `mongo=connected`, no `[REQ-ERR]` | Node event-loop blocked or Mongo throttled | Check nearest `[STALL]` and the `loop=` field of `[HEALTH]`; if `loop` is calm, then Atlas Metrics |
| `[REQ-ERR]` appears with stack | Deterministic bug | Read the stack — fix at the line shown |
| **No `[REQ]` line at all** for the slow click | Request never reached the server | Check Render Events tab (instance restart? deploy?), CDN, or frontend timeout |

### Step 3 — Check the closest `[HEALTH]` line

Logged every 30 min, current format:

```
[HEALTH] uptime=Xh mem=YMB/ZMB rss=RMB loop=p99:Ams/max:Bms mongo=connected
```

- `loop=p99` high (hundreds of ms) or `max` multi-second → **process is CPU/event-loop bound** (the head-of-line pattern). This is the usual cause.
- `mem` climbing toward 300MB+ over days → a leak (would also emit `[HEALTH-WARN]`). Note: historically `mem` is flat ~95MB, so this would be new.
- `loop` near 0 but requests slow → Mongo-side; cross-check Atlas (Step 4).
- A `[STALL]` line near the slow window is more precise than `[HEALTH]` — it captures the exact block and what was running.

### Step 4 — Check MongoDB Atlas

Atlas dashboard → cluster → **Metrics** tab. Look at the past week:
- **Operation Execution Time** — spikes mean Mongo is the bottleneck
- **Connections** — approaching the M0 cap (500) means the pool is leaking or change-stream is misbehaving

### Step 5 — Match the timeline

Cross-reference Render `[REQ] ... SLOW` timestamps with Atlas metric spikes. If they coincide, the cause is Mongo-side. If `[REQ]` is slow but Atlas is calm, it's Node-side.

## Hypotheses (historical — see STATUS for current truth)

Original ranking of "next culprit." Updated with what we now know.

### H1 — Heap pressure + GC stalls — ❌ DISPROVEN (2026-06-18)

35-day flat-heap trace (~95MB, no restarts) ruled this out. The rate-limit store self-resets each window (it is *not* a cumulative weeks-long leak), and the `full` category cache is a single overwritten slot, not growth. **Do not re-chase.** (Original notes: default in-memory `express-rate-limit` store; `categoryController.js` `full` cache slot; 460MB+0.5CPU GC cost.)

### H2 — WebSocket broadcasts on every product change — ⚠️ NOW ACTIVE

Was dormant (change stream watched the wrong collection). `197e747` fixed the collection, so this path **now fires** on every product change: `broadcastProductsUpdate` + a synchronous full category rebuild, off the request path. Confirmed to produce occasional ~1s `[STALL]`s. **Next move (server-only): debounce the change-stream handler** so a burst (bulk product update) coalesces into one rebuild — see "Still open" in STATUS. The original coordinated FE option (`PRODUCTS_INVALIDATE` ping + a `web/src/lib/websocket.ts` handler that `dispatch(fetchProducts())`) is still valid if lighter payloads are wanted.

### H3 — Mongo connection-pool starvation

- `maxPoolSize: 10` in `MONGO_OPTIONS` (`server/core.js`). Change-stream holds one slot continuously.
- Bumping the pool size doesn't help on M0 — the right move is reducing the standing op rate (i.e. fix H2).

### H5 — Stacked retries (fixed in `15e91cf`, monitor for recurrence)

If logs show repeated `⚠️ Change Stream closed, will retry...` clusters without the gap the guard enforces, the guard isn't doing its job and needs investigation.

## What is in the logs and what each line means

| Log prefix | Source | Meaning |
|---|---|---|
| `✅ MongoDB connected: <host>/<db>` | `core.js:167` | Mongoose finished connecting. The host/db lets you confirm the right Atlas cluster after long gaps. |
| `⚠️ MongoDB disconnected` / `🔄 MongoDB reconnected` | `core.js:155-159` | Atlas dropped/recovered. Occasional is fine. Frequent (multiple per hour) is not. |
| `❌ MongoDB connection error event: <msg>` | `core.js:161-163` | Atlas threw. Read the message. |
| `[HEALTH] uptime=Xh mem=YMB/ZMB rss=RMB loop=p99:Ams/max:Bms mongo=<state>` | `core.js` `startHealthDiagnostics` | Every 30 min. `loop` = event-loop delay (the key CPU-bound signal); `max` is per-window. |
| `[HEALTH-WARN] <reasons> rss=RMB cacheKeys=N` | `core.js` `startHealthDiagnostics` | Slow-burn alarm: heap>300MB, mongo not connected, or loop p99>500ms. Greppable; means investigate. |
| `[STALL] blocked~Xms inflight=N oldest=[...] mem=... mongo=... wsClients=N broadcast=<yes/no> cacheKeys=N` | `core.js` `startIncidentRecorder` | Event-loop blocked >~700ms. **The single most useful line on a recurrence** — names what was running. |
| `[BROADCAST] <products\|categories> <ms>ms [id=...]` | `core.js` broadcast fns | A change-stream broadcast took >200ms. Clusters of these = bulk product update → debounce (H2). |
| `[REQ] <method> <url> <status> <ms>ms mongo=<state> [SLOW]` | `core.js`, request logger | Slow or error response. Useful, but background stalls won't appear here — use `[STALL]`. |
| `[REQ-ERR] <route>: <Error stack>` | `productController.js` | Server-side error in a product endpoint. Full stack, not just `.message`. |
| `🟢 Change Stream initialized.` | `core.js:325` | Change-stream cursor opened. Should happen once on startup, occasionally on reconnect. |
| `⚠️ Change Stream closed, will retry...` | `core.js:319` | Change-stream dropped. With the `retryScheduled` guard, only one retry should be pending at a time. |
| `🟢 New WebSocket client connected` / `🔴 WebSocket client disconnected` | `core.js:256, 279` | Front-end browser tabs opening/closing. |

## Things to avoid

- **Do not** suggest `app.set('trust proxy', true)` — security hole. Always `1` for single-Render-proxy setups.
- **Do not** add a logging library (winston/pino). Render's log stream captures `console.*` natively; adding a library means new failure modes for no win.
- **Do not** propose Redis as the first move — it's another paid service. Bounded in-memory or Mongo-backed alternatives exist.
- **Do not** rewrite the WebSocket layer wholesale. The current design is fine; just send lighter payloads.
- **Do not** treat a single `[REQ] ... SLOW` line as the issue returning. Look for a pattern over time and corroborating `[HEALTH]` or Atlas metrics.
- **Do not** delete the `tmpclaude-*-cwd` directories at the repo root without checking — they're stale CWD markers from previous sessions, but `.gitignore` already covers them; just leave them be.

## Project quirks worth knowing

- Schema fields are in **Hebrew** (e.g. `שם` = name, `מחיר רגיל` = regular price, `קטגוריות` = categories). The collection itself is named `"test"` (`server/models/productModel.js:41`) — a legacy name, not a typo. Don't rename it without coordinating data migration.
- Category strings are `"Main"` or `"Main > Sub"` joined by `,` for products in multiple categories. Parsing lives in `server/controllers/categoryController.js`.
- The frontend has its own 5-minute localStorage cache for products and categories (`web/src/lib/redux/actions/`). When debugging "data not loading," consider whether the client is showing stale cached data vs. a real server failure.
- `combined.js` runs Express *and* the Next.js handler in one process on Render to save money. Long-running CPU work in the API directly delays page renders.

## Memory and plan files

This runbook is self-contained — the ranked hypotheses, evidence, and deferred fixes are all above. An earlier local planning document was folded in here by `7d1a235` and no longer exists; don't go looking for one.
