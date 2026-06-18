# CLAUDE.md — runbook for the recurring "data not loading" issue

This file exists because **the same problem keeps coming back every couple of months**. Read it before suggesting changes — most of the obvious moves have already been tried, and there are infra constraints that rule out the easy answers.

## STATUS — 2026-06-18: root cause found & fixed (READ THIS FIRST)

The "redeploy fixes it for weeks" framing further down pointed at **runtime state drift / heap growth (H1)**. **That was wrong.** A 35-day production `[HEALTH]` trace showed heap dead-flat at ~95MB (cap 460MB) with no restarts — no leak, no drift. **H1 is disproven; do not re-chase it.**

**Actual root cause: load-induced head-of-line blocking on the single 0.5-CPU process.** Under a crawler walking the category tree, every hot read endpoint did a full-collection scan + synchronous `JSON.stringify` (and the regex category query forces a COLLSCAN). On half a CPU these serialize through one event loop, so requests pile up and release in *waves* — even a trivial indexed `findById` took 30–120s. It is congestion **under load**, not slow accumulation; "redeploy fixes it" merely drops the queued work. Confirmed fixed in prod: the same requests went **36,000ms → 36ms**.

### What shipped (newest first) — all live on `main`
- `5d68fe7` — **Incident recorder.** New `[STALL]`, `[HEALTH-WARN]`, `[BROADCAST]` logs so a recurrence records its own cause (see the log table). The `[HEALTH]` line gained `rss` and `loop=p99/max` (event-loop delay).
- `5be5508` — **Dependabot remediation.** All prod-relevant criticals/highs cleared (`npm audit fix` in `server/` + `web/`; `next`→14.2.35; `jspdf`→4.2.1).
- `197e747` — **Change stream fixed.** It had watched collection `"products"` but data lives in `"test"`, so it never fired. Now uses `Product.watch()` and invalidates the response cache on change. NOTE: this **re-activated H2 broadcasts** (see Still open).
- `a2cba64` — **The fix.** Single-flight + short-TTL response cache (`server/utils/responseCache.js`) on getAll, category, nav, site-stats, seo-text. N concurrent identical requests collapse to one Mongo op + one serialize. This resolved the slowness.

### Decision rule when it feels slow again
Open Render logs and grep for `STALL`, `HEALTH-WARN`, `BROADCAST`, then `SLOW`:
- A `[STALL]` / `[HEALTH-WARN]` / `[BROADCAST]` line → it **names the cause** (in-flight request, broadcast state, memory, mongo, `cacheKeys`). Fix that.
- A `[REQ] … SLOW` line but no `[STALL]` → a single slow request/endpoint (read the URL).
- **Nothing** in any of them but it's slow → not the app: look upstream (CDN / Render platform / network / frontend cache).

### Still open / deferred (a new session can pick these up)
- **Broadcast debounce (server-only).** `197e747` turned change-stream broadcasts back on; each product change runs a synchronous full category rebuild + product broadcast *off the request path* (invisible to `[REQ]`; shows as `[BROADCAST]` / `[STALL]` with `broadcast=IN_PROGRESS`). Fine for single edits; under a **bulk product update** it fires many ~1s rebuilds back-to-back. If `[BROADCAST]` lines cluster, debounce the change-stream handler (coalesce a burst into one rebuild after ~1–2s of quiet). This is the live H2 follow-up.
- **Bounded cache.** `responseCache` evicts lazily (on access) with no size cap. A long crawl of many distinct `category:` / `seo:` keys can grow it. Watch `cacheKeys` in `[STALL]` / `[HEALTH-WARN]`; if it climbs into the tens of thousands, add a periodic sweep + max-size eviction.
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

There is a long-form planning document at `C:\Users\eladt\.claude\plans\last-time-i-work-atomic-sutherland.md` with ranked hypotheses, evidence, and proposed-but-not-yet-implemented fixes. Read it if you need more depth than this runbook. It is not in the repo — it's local to the user's machine.
