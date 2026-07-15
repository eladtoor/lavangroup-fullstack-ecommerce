# CLAUDE.md — runbook for the recurring "data not loading" issue

This file exists because **the same problem keeps coming back every couple of months**. Read it before suggesting changes — most of the obvious moves have already been tried, and there are infra constraints that rule out the easy answers.

## STATUS — 2026-07-15: ROOT CAUSE STILL UNKNOWN. EXPECT IT BACK. (READ THIS FIRST)

**Do not believe any claim that this is "fixed".** The 2026-07-15 session shipped real improvements and eliminated most of the suspect list, but **it did not find the root cause**, and the slowness will most likely return. Read this whole section before touching anything — it exists mainly to stop you re-deriving dead theories.

### ⛔ WHEN IT LAGS AGAIN: DO NOT REDEPLOY

This is the most important operational rule in the repo. **A redeploy makes the symptom vanish for weeks and destroys the only evidence.** That is the documented fingerprint ("redeploy fixes it for weeks"), and on 2026-07-15 we walked into it: the deploy at 13:41 took requests from 10.8s to 0.3s, and the restart — *not* the code change — is what did it (proof below). We then had to wait for the next recurrence.

When it lags: **go straight to THE PLAYBOOK below.** It takes ~3 minutes. Deploy only once you have the data.

### The symptom has had (at least) two different causes

| Cause | Signature | Status |
|---|---|---|
| **CPU head-of-line blocking** | `[STALL]` present, `[HEALTH] loop=p99` high | **Fixed** `a2cba64` (2026-06-18). Verified still working 2026-07-15: `getAll` cache hit = 0.43s. |
| **The 2026-07-15 one** | **No `[STALL]`**, loop calm, CPU ~0%, Atlas idle — yet requests take 10-20s | **UNSOLVED.** Cleared by restart only. |

**Never diagnose this from the symptom.** "Clicking a product hangs" has meant two unrelated things. Always read the logs first.

### 2026-07-15 — what is PROVEN

- **The app was idle, not struggling.** Render CPU flat ~0-5% of the 0.5 limit for 12h; heap flat ~90MB; uptime 644h (no restart). `[HEALTH] loop=p99:23ms/max:194ms` — the loop was never blocked. **Zero `[STALL]`/`[BROADCAST]`/`[HEALTH-WARN]`** while requests took 10-20s. The recorder was alive (`[HEALTH]` lines printing; the same function starts both), so the silence was real evidence.
- **It is not the network/proxy/CDN.** `/health` (no Mongo) held **0.31s** rock-steady *while product requests took 10s on the same process*.
- **It is not Atlas.** Checked directly in the Atlas account that owns the cluster (`ac-5jqcamb-...zqb8c1m` / `LavanGroupDB`, NOT the `EladProj`/license-keys account): **Operation Throttling flat ZERO for 2 months**, Connections flat at **4** (never near `maxPoolSize:10`, let alone the 500 cap), Opcounters **~0.3/s**, dataset **677KB**. Mongo was idle and never throttled. **M0 saturation is disproven — do not chase it.**
- **The same request twice, back-to-back, gave 10s then 0.5s** — every cycle for 4 minutes. Not slow work; *waiting*.
- **The restart is what fixed it, not the cache.** After deploy, a **cold cache miss on a never-requested product** returned in 0.30s. A miss goes to Mongo either way — if the cache were doing the work, a miss would still be slow. It wasn't.

### What that leaves

Something **inside the Node process** that degrades over weeks, makes Mongo reads take ~10s while both the app *and* the database sit idle, and is wiped by a restart. The time is going somewhere between Express and Atlas — the driver/connection path — but pool exhaustion looks unlikely too, since Atlas showed connections flat at 4 (if checkouts were queuing, the driver would have opened more, up to 10).

**Dead theories — do not re-chase:** H1 heap/GC (flat heap, twice confirmed) · H2 broadcast storm (zero `[BROADCAST]`) · M0 saturation (throttling = 0) · Atlas connection cap (4 of 500) · CPU/event-loop (0%, calm) · network/CDN (`/health` steady) · connection warm-up cost (cold misses are 0.3s) · the response cache being stripped (no broadcasts fired).

### What shipped 2026-07-15

Improvements, not a cure:
- `productController.js` — `getProduct` now uses `cache.singleFlight("product:<id>")` (60s TTL). It was the only hot read `a2cba64` missed, and it's the exact endpoint the symptom names. Verified: 10 concurrent requests → **1 Mongo op**. Note `"product:"` does NOT prefix-match `"products:all"`, so both are cleared separately.
- `ProductCard.tsx` — `prefetch={false}`. The dynamic product route meant App Router's prefetch-on-viewport ran ~10 full SSRs per category grid.
- `product/[productIdSlug]/page.tsx` — React `cache()` dedupes the double product fetch (`fetch` uses `no-store`, which opts out of Next's own dedupe).
- `sitemap.ts` — data cached via `unstable_cache({revalidate:3600})`. **`force-dynamic` must stay**: the Render build runs before the server exists, so a static sitemap would fetch a dead API. The old route-level `revalidate` was dead code under `force-dynamic`.
- `websocket.ts` — `reconnectAttempts` now resets only after 30s of stability (it reset in `onopen`, so a socket that opened then died reset the counter every cycle → endless 1s reconnect loop). No longer reconnects on a clean 1000 close. Costs no Mongo; unrelated to the slowness.
- **`core.js` — pool + command instrumentation. This is the one that matters next time.** See below.

### The instrumentation that should crack it next time

`[HEALTH]` now carries `pool=`, `poolWait=` and `mongoCmd=`, plus two immediate lines — `[POOL]` (checkout waited >1s) and `[MONGO-SLOW]` (round-trip >1s). Together they decompose a slow request:

> **request time = pool wait + command duration + our own code**

**→ How to read it: THE PLAYBOOK, Step 3.** Verified live on 2026-07-15: `pool=open:4` matches Atlas's own connection count exactly.

This is deliberately the same play as `5d68fe7` (the incident recorder), which is why 2026-07-15 took one session instead of two months: instrument, don't guess.

### The older 2026-06-18 finding (still valid)

The "redeploy fixes it for weeks" framing further down pointed at **runtime state drift / heap growth (H1)**. **That was wrong.** A 35-day production `[HEALTH]` trace showed heap dead-flat at ~95MB (cap 460MB) with no restarts — no leak, no drift. **H1 is disproven; do not re-chase it.** (Re-confirmed 2026-07-15.)

**Actual root cause: load-induced head-of-line blocking on the single 0.5-CPU process.** Under a crawler walking the category tree, every hot read endpoint did a full-collection scan + synchronous `JSON.stringify` (and the regex category query forces a COLLSCAN). On half a CPU these serialize through one event loop, so requests pile up and release in *waves* — even a trivial indexed `findById` took 30–120s. It is congestion **under load**, not slow accumulation; "redeploy fixes it" merely drops the queued work. Confirmed fixed in prod: the same requests went **36,000ms → 36ms**.

### What shipped (newest first) — all live on `main`
- `5d68fe7` — **Incident recorder.** New `[STALL]`, `[HEALTH-WARN]`, `[BROADCAST]` logs so a recurrence records its own cause (see the log table). The `[HEALTH]` line gained `rss` and `loop=p99/max` (event-loop delay).
- `5be5508` — **Dependabot remediation.** All prod-relevant criticals/highs cleared (`npm audit fix` in `server/` + `web/`; `next`→14.2.35; `jspdf`→4.2.1).
- `197e747` — **Change stream fixed.** It had watched collection `"products"` but data lives in `"test"`, so it never fired. Now uses `Product.watch()` and invalidates the response cache on change. NOTE: this **re-activated H2 broadcasts** (see Still open).
- `a2cba64` — **The fix.** Single-flight + short-TTL response cache (`server/utils/responseCache.js`) on getAll, category, nav, site-stats, seo-text. N concurrent identical requests collapse to one Mongo op + one serialize. This resolved the slowness.

### Still open / deferred (a new session can pick these up)
- **Broadcast debounce (server-only).** Still unimplemented, but **downgraded**: a 1h log sweep on 2026-07-15 during live slowness found **zero `[BROADCAST]` lines**, so this path was not firing at all and is *not* what causes the recurrence. Only act if `[BROADCAST]` lines actually cluster (i.e. during a real bulk product update); then coalesce a burst into one rebuild after ~1-2s of quiet.
- **Bounded cache — now more relevant.** `responseCache` evicts lazily (on access) with no size cap. As of 2026-07-15 it also holds `product:<id>`, one key per product, on top of `category:` / `seo:<name>`. Absolute size is still small (all products serialize to ~300KB), but the key set is **not** fixed. Watch `cacheKeys` in `[STALL]` / `[HEALTH-WARN]`; if it climbs into the tens of thousands, add a periodic sweep + max-size eviction.
- **Self-referential HTTP (not yet fixed).** `NEXT_PUBLIC_API_URL` points at the public domain, so Next server components fetch the Express API by going **out to Render's edge and back into the same process** (`combined.js` serves both). Every SSR data fetch pays a full public round-trip. Pointing it at `http://127.0.0.1:$PORT` — or calling the controllers in-process — would remove that. Left alone 2026-07-15 because `NEXT_PUBLIC_*` is inlined at build time and CPU was not the bottleneck; revisit if CPU ever is.
- **The local `web` build fails without env vars.** `npm run build` in `web/` exits 1 on a clean tree with 51× Firebase `auth/invalid-api-key` — the prerender of client pages needs the Firebase env. Render has them, so it builds fine there. Don't panic at a red local build; compare against a stashed baseline before blaming your changes.
- **Next 15 migration.** The only prod vuln residual (image-optimizer / RSC DoS highs) is patched only in Next 15 — a deliberate major upgrade, deferred.
- **`firebase-admin` 13→14** (clears the google-cloud moderate chain) and **dev-only vuln tooling** (concurrently/shell-quote, eslint 9, glob) — deferred, not prod runtime.

## THE PLAYBOOK — when it lags, do exactly this

Whole thing takes ~3 minutes. Do it **before** anything else, especially before deploying.

### Rule zero: DO NOT REDEPLOY

A restart makes the symptom vanish for weeks and takes the evidence with it. That is the entire reason this bug has outlived months of investigation — every recurrence gets cleared before anyone looks. We did it to ourselves on 2026-07-15 with the window wide open and lost it. **Capture first, deploy after.**

### Step 1 — Four greps (~2 min)

Render dashboard → `hybrid-app-1` → **Logs**. Search each term:

| Grep | Meaning if present |
|---|---|
| `POOL` | **Jackpot.** A connection checkout waited >1s → it's the pool (H3). |
| `MONGO-SLOW` | **Jackpot.** A Mongo round-trip took >1s → it's the wire/driver path. |
| `STALL` | The event loop blocked → a *different* bug from the 2026-07-15 one. Read `oldest=[…]`. |
| `HEALTH` | Grab the 2-3 lines nearest the slow window — it summarises everything. |

Also worth a look: `HEALTH-WARN` (any alarm), `BROADCAST` (bulk-write storms), `SLOW` (which endpoint), `REQ-ERR` (stack traces).

### Step 2 — The 30-second discriminator

`/health` (`core.js`) returns a static string and never touches Mongo. Compare it to a Mongo-backed endpoint:

```bash
URL=https://hybrid-app-1-2haj.onrender.com
for i in 1 2 3; do curl -s -o /dev/null -w "health  %{time_total}s\n" "$URL/health"; done
for i in 1 2 3; do curl -s -o /dev/null -w "product %{time_total}s\n" "$URL/api/products/670463ee7e9f9f8a73556f37"; done
```

- **`/health` fast + product slow** → the process and network are fine; it's the Mongo path. (2026-07-15: 0.31s vs 15.9s.)
- **Both slow** → the process/network really is the bottleneck; follow the `[STALL]` trail.

### Step 3 — Read the decomposition

`[HEALTH]` carries the whole picture. **request time = pool wait + command duration + our own code**:

```
[HEALTH] uptime=... loop=p99:X/max:Y mongo=connected
         pool=open:N/inUse:N/pending:N poolWait=avg:X/max:Y mongoCmd=max:X/slow:N
```

The readings are mutually exclusive — that is the whole point of the instrumentation:

| Reading | Conclusion | Where to look |
|---|---|---|
| `poolWait max` ≈ request time | **Pool starvation (H3)** | `maxPoolSize: 10`; the change stream permanently holds a slot; `maxIdleTimeMS: 30000` churning connections. |
| `mongoCmd max` ≈ request time | **The round-trip itself** | Atlas proved Mongo isn't busy, so the time is on the wire / in the driver's socket handling: dead sockets, DNS/SRV, TLS. |
| **Both ≈ 0 while requests take 10s** | **The time is in OUR code** — everything above was misattributed | Time the code *around* the `await` in `getProduct`, and the middleware chain. Surprising but decisive. |
| `loop=p99` high / `[STALL]` present | CPU-bound — the *2026-06-18* bug pattern, not the current one | Read `oldest=[…]` for the endpoint. |

### Step 4 — Record `uptime=`

**Write down the `uptime=` value from `[HEALTH]` when it starts lagging.** It was **644h** on 2026-07-15. If it's ~650h again → something time-based. If it's ~80h → load- or event-triggered. There is no other way to get this number, and it narrows the search enormously.

### Don't bother with

- **Atlas.** Exonerated 2026-07-15: throttling flat zero for 2 months, connections 4 of a 500 cap, ~0.3 ops/s, 677KB dataset. Only revisit if `[MONGO-SLOW]` fires *and* you need to split wire-time from Mongo-time.
- **The dead theories** listed in STATUS. Re-deriving them is how months got burned.

### Caveat on timing

The `getProduct` cache (2026-07-15) cuts the Mongo op rate ~10x, so it may **delay** the recurrence — and if the trigger is load-related, the next one could look different. **A longer quiet period is not proof it's cured.**

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

## Reference — details behind the playbook

**The procedure is THE PLAYBOOK above.** This section is only the extra detail it doesn't need inline.

### Reading `[REQ]` lines

```
[REQ] GET /api/products/<id> 200 14820ms mongo=connected SLOW
```

The middleware only logs requests that are slow (>1000ms), error (>=400), or anything in dev. `/health` is excluded by design — that exclusion is what makes it a clean control in the Step 2 test.

| Signature | Likely cause | Next |
|---|---|---|
| High `ms`, `mongo=connected`, no `[REQ-ERR]` | Idle-waiting (2026-07-15) or CPU-bound (2026-06-18) | Playbook Step 3 — `poolWait` / `mongoCmd` / `loop` say which. |
| `[REQ-ERR]` with a stack | Deterministic bug | Read the stack; fix at the line shown. |
| **No `[REQ]` line at all** for the slow click | Never reached the server | Render Events tab (restart? deploy?), CDN, or a frontend timeout. |

### Atlas — the cluster is NOT in the first account you'll try

Prod is `ac-5jqcamb-shard-00-0X.zqb8c1m.mongodb.net` / **`LavanGroupDB`**, in the **"Lavan Group"** org. The `EladProj` / `license-keys` / `Cluster0` account is a *different app* (`msls-license-server`) — a dead end. Confirm the host from the `✅ MongoDB connected:` log line before trusting any chart.

Checked in full on 2026-07-15 (2-month and 8-hour windows, spanning a live slow period): **Operation Throttling flat ZERO**, **Connections flat 4** (cap 500, `maxPoolSize` 10), **Opcounters ~0.3/s**, Network ~300B/s, dataset 677KB. Mongo is idle and was never throttled — **exonerated, don't re-check**.

**M0 does not expose Operation Execution Time.** That is exactly why `[MONGO-SLOW]` had to be added in-app. Only revisit Atlas if `[MONGO-SLOW]` fires *and* you need to split wire-time from Mongo-time.

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
| `[HEALTH] uptime=Xh mem=… rss=… loop=p99:A/max:B mongo=<state> pool=open:N/inUse:N/pending:N poolWait=avg:X/max:Y mongoCmd=max:X/slow:N` | `core.js` `startHealthDiagnostics` | Every 30 min. `loop` = event-loop delay (the CPU-bound signal). `poolWait` = time spent waiting for a Mongo connection; `mongoCmd` = the command round-trip. All three are per-window (reset each log); `pool=` is a live gauge. |
| `[HEALTH-WARN] <reasons> rss=RMB cacheKeys=N pool=…` | `core.js` `startHealthDiagnostics` | Slow-burn alarm: heap>300MB, mongo not connected, loop p99>500ms, pool wait >1s, pending ≥ maxPoolSize, a failed checkout, or a command >1s. Greppable; means investigate. |
| `[POOL] checkout waited Xms open:N/inUse:N/pending:N maxPoolSize=N` | `core.js` `attachPoolMonitoring` | **A connection checkout took >1s** — requests are queuing for the pool rather than running queries (H3). Rate-limited to one line / 10s. |
| `[MONGO-SLOW] <cmd> <ok\|FAILED> Xms pool=…` | `core.js` `attachCommandMonitoring` | **A Mongo command round-trip took >1s** as the driver saw it. With a calm `[POOL]`, the time is on the wire / in Mongo — the half Atlas cannot show on M0. Rate-limited to one line / 10s. |
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
