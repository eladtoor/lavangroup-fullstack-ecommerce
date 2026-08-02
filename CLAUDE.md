# CLAUDE.md — runbook for the recurring "data not loading" issue

This file exists because **the same problem keeps coming back every couple of months**. Read it before suggesting changes — most of the obvious moves have already been tried, and there are infra constraints that rule out the easy answers.

## STATUS — 2026-08-02: THE 7b4a6ce FIX FAILED — CHANGE STREAM REMOVED ENTIRELY (READ THIS FIRST)

The planned verification ran on **2026-08-02** and the fix **failed**: the pool was starved again, live, 11 days after deploy, with the site's cold misses back at 26-30s. The change stream has now been **removed from the codebase** — the third incident in three months from the same mechanism was ended by deleting the mechanism, not patching it a third time.

### What the verification found (captured live before any deploy, per Rule Zero)

Curls: `/health` 0.31-0.59s; cold misses 26.7-29.7s (product ids, `site-stats`, `getAll`). Logs:

```
[HEALTH] uptime=262.0h loop=p99:22ms mongo=connected pool=open:15/inUse:10/pending:3
         poolWait=avg:9072ms/max:26426ms mongoCmd=max:4ms/slow:0 changeStreams=1/awaits:600
[HEALTH-WARN] pool_wait_max=26426ms pool_checkout_failed=5 ...   (every 30 min for days)
[POOL] checkout waited 26452ms open:15/inUse:10/pending:3 maxPoolSize=10
```

**`changeStreams=1` while `awaits:600`.** One healthy stream does ~60 awaitData polls per 30-min window; 600 = **ten live cursors**. The gauge shipped specifically to catch this leak was blind to it. The climb across the 7-day log retention:

| When (uptime) | `awaits` → real cursors | gauge said | pool |
|---|---|---|---|
| Jul 26 daytime (~97h) | 180 → **3** | 1 | inUse:3, poolWait ~1ms — *looked healthy* |
| Jul 26 23:43 reconnect | 224→300 → **4→5** | dropped to **0** | inUse:5 |
| Jul 27 16:01 / 17:22 / 17:26 | — | **9 / 10 / 11** `closed` lines in the same second, each answered by one `initialized. live=1` | |
| Jul 28 03:39 | — | **12** closes in one burst | |
| Jul 31 → Aug 2 | 600 → **10** (pool-capped) | 1 | inUse:10 pinned 24/7, 5 failed checkouts per window |

### Why the fix failed — the driver heals itself; our code misread the heal as a death

On a resumable network error the MongoDB driver closes its internal cursor — which emits `close` through the mongoose wrapper — **and then auto-resumes. The stream is still alive.** Our `close` handler treated close as death: it decremented the gauge (before its ownership check), nulled `changeStreamInstance` (orphaning the healed stream **with its `change` handler and its pool connection**), and scheduled a retry that created a brand-new stream. Net per Atlas blip: **+1 live orphan, gauge back to exactly 1.** The 7b4a6ce retire block never executed — by the time `setupChangeStream` ran, the reference was already null. Bitter detail: the runbook's old pass criterion (isolated `closed` lines + `live=1`) is exactly what a full-blown leak printed.

### What shipped 2026-08-02

- **The change stream is GONE** (`d27dad6`, `server/core.js`). Live updates now originate from the write path: `productController` create/update/delete call `notifyProductChange()` (`server/utils/changeNotifier.js` — a tiny registry that breaks the core↔controllers require cycle), which clears the category caches and fires the same WebSocket broadcasts as before — no Mongo cursor held 24/7, nothing left to leak. (Post-deploy testing then found WS *delivery* itself has a long-pre-existing edge-level problem — see "WS push delivery is broken at the edge" in Still open. Client freshness actually comes from the refetch machinery, which is unaffected.) **Trade-off (user-approved):** writes that bypass the API — Atlas/Compass edits, `scripts/` — no longer trigger a push; they surface via cache TTL (≤60s server, ≤5min client localStorage).
- **`singleFlight` releases only its own in-flight slot** (`cf693d6`, `responseCache.js`). A `clear()` during a flight let the old producer's cleanup evict its replacement, so producers duplicated instead of coalescing — 1-2 extra pool checkouts each, stacked on the starvation. Same lost-ownership bug class as the stream.
- **`waitQueueTimeoutMS: 10000`** (`8b591c3`). Pool checkouts now fail visibly after 10s instead of waiting forever (they queued 27s+ during this incident, and a producer stuck on a checkout pinned its singleFlight key until restart).
- Deployed 2026-08-02; any observation clock restarts from that deploy.

### The new healthy baseline — three things to memorize

1. `[HEALTH]` reads **`changeStreams=0/awaits:0`** — both **zero, always**. Any nonzero `awaits:` (it comes in multiples of ~60 per stream per window) means an awaitData cursor was reintroduced — treat it as this leak returning.
2. `pool=inUse:` idles at **0-2**. Pinned near 10 with `poolWait` in the seconds = something is holding connections; read `awaits:` first.
3. The lines `🟢 Change Stream initialized` / `⚠️ Change Stream closed` **can no longer be printed by this codebase.** If one appears in the logs, a watch came back.

### Verifying the 2026-08-02 deploy

Immediately after deploy: cold-miss curls (Step 2 of THE PLAYBOOK) ≈ `/health`; first `[HEALTH]` shows the baseline above; an admin edit reaches an open tab within ~1s. Over the following days, spot-check that `awaits:` stays 0 and `inUse` stays low. There is no "survive the next reconnect" vigil anymore — Mongo reconnects no longer create or destroy anything — so the baseline gauges are the whole check. A fast site right after deploy still proves nothing by itself; the restart alone guarantees that.

## STATUS — 2026-07-22: ROOT CAUSE FOUND (historical — the fix it shipped later FAILED; see 2026-08-02 above)

> The root-cause *diagnosis* below was correct and stands. The **fix** it shipped did not survive verification — see the 2026-08-02 STATUS above for what actually leaked and what replaced it.

**The change stream leaked.** `setupChangeStream` in `server/core.js` orphaned a still-running change stream on every reconnect. Each orphan sat on its own 30-second `awaitData` `getMore`, holding one Mongo pool connection forever. They accumulated one per reconnect until all 10 pool slots were gone; from then on **every** query waited ~12s for a connection to briefly free up. Fix shipped 2026-07-22; **it failed** (the orphaning path was the driver's auto-resume `close`, which it left untouched) and the stream was removed 2026-08-02.

The instrumentation shipped on 2026-07-15 named it on its first recurrence, which is exactly what it was built for. Do not undo that pattern.

### The proof (captured live, before deploying)

```
[HEALTH] uptime=167.0h loop=p99:22ms/max:202ms mongo=connected
         pool=open:14/inUse:10/pending:4
         poolWait=avg:12140ms/max:29480ms mongoCmd=max:30206ms/slow:600
[MONGO-SLOW] getMore ok 30001ms pool=open:14/inUse:10/pending:5
[POOL]       checkout waited 13554ms open:14/inUse:10/pending:5 maxPoolSize=10
```

`inUse:10` of `maxPoolSize:10`, identical in every 30-min sample for 12+ hours. `30001ms` is `maxAwaitTimeMS` — the change stream's own poll. Counting `⚠️ Change Stream closed` lines landing in the *same second* gives the number of streams alive at that moment: **1 → 3 → 5 → 10 → 11 → 10** over four days.

### It was never the product page

Measured live during the incident:

| Endpoint | Cache miss | Cache hit |
|---|---|---|
| `/health` (no Mongo) | 0.40s | — |
| `/api/site-stats` | 16.6s | 0.46s |
| `/api/products/:id` | 29.0s | 1.0s |
| `/api/products/getAll` | **28.8s** | 0.78s |

**Every cache miss was slow, `getAll` included.** The symptom only *looked* product-specific because `products:all` and `category:` keys are almost always warm, while `product:<id>` (334 ids) and `site-stats` (single slot, 60s TTL, low traffic) almost always miss. The homepage's 4 stat cards hang for the same 15s as a product page, and they share no code — just a cache miss. **A "fast" page proves nothing; it may just be a cache hit or the frontend's 5-min localStorage cache.**

### Why it fooled everyone for months

The app really was idle — CPU ~0%, event loop calm, heap flat, no `[STALL]`, and Atlas genuinely doing nothing (10 cursors returning every 30s ≈ 0.3 ops/s, which is exactly the opcounter reading that "exonerated" Atlas). The orphans block on `awaitData`; they never compute. And a restart kills them, which is the entire "redeploy fixes it for weeks" fingerprint: the leak restarts from one stream and has to climb back to 10.

### ⛔ IF IT COMES BACK: DO NOT REDEPLOY FIRST

Still the most important operational rule here. A restart hides the symptom for weeks and takes the evidence with it. **Go to THE PLAYBOOK below (~3 minutes), then deploy.**

First thing to check now: `awaits:` in `[HEALTH]`. Since 2026-08-02 the healthy value is **0** (the stream is gone). The 2026-08-02 incident proved the hand-kept `changeStreams=` gauge can read `1` — or `0` — while ten cursors are alive; `awaits:` is driver-side truth (~60 per stream per 30-min window) and is the number to trust.

### The symptom has had three different causes

| Cause | Signature | Status |
|---|---|---|
| **CPU head-of-line blocking** | `[STALL]` present, `[HEALTH] loop=p99` high | **Fixed** `a2cba64` (2026-06-18). |
| **Change-stream leak → pool starvation** | `poolWait avg` seconds, `inUse` = `maxPoolSize`, `awaits` ≥ ~120/window, loop calm | Fix `7b4a6ce` **failed** (it blinded the gauge, not the leak); **stream removed 2026-08-02**. |
| Anything else | — | Read the logs. Don't assume. |

**Never diagnose this from the symptom.** "Clicking a product hangs" has now meant three unrelated things.

### 2026-07-15 — what is PROVEN

- **The app was idle, not struggling.** Render CPU flat ~0-5% of the 0.5 limit for 12h; heap flat ~90MB; uptime 644h (no restart). `[HEALTH] loop=p99:23ms/max:194ms` — the loop was never blocked. **Zero `[STALL]`/`[BROADCAST]`/`[HEALTH-WARN]`** while requests took 10-20s. The recorder was alive (`[HEALTH]` lines printing; the same function starts both), so the silence was real evidence.
- **It is not the network/proxy/CDN.** `/health` (no Mongo) held **0.31s** rock-steady *while product requests took 10s on the same process*.
- **It is not Atlas.** Checked directly in the Atlas account that owns the cluster (`ac-5jqcamb-...zqb8c1m` / `LavanGroupDB`, NOT the `EladProj`/license-keys account): **Operation Throttling flat ZERO for 2 months**, Connections flat at **4** (never near `maxPoolSize:10`, let alone the 500 cap), Opcounters **~0.3/s**, dataset **677KB**. Mongo was idle and never throttled. **M0 saturation is disproven — do not chase it.**
- **The same request twice, back-to-back, gave 10s then 0.5s** — every cycle for 4 minutes. Not slow work; *waiting*.
- **The restart is what fixed it, not the cache.** After deploy, a **cold cache miss on a never-requested product** returned in 0.30s. A miss goes to Mongo either way — if the cache were doing the work, a miss would still be slow. It wasn't.

### Where that reasoning went wrong

The 2026-07-15 session concluded pool exhaustion was "unlikely, since Atlas showed connections flat at 4 — if checkouts were queuing, the driver would have opened more, up to 10." **That inference was correct but the reading was taken too early.** The leak was only ~4 streams deep at that point. It reached 10 on 2026-07-20 and the pool has been pinned ever since. The lesson is not "Atlas lied" — it is that **a leak measured mid-climb looks like a healthy steady state.** Prefer a trend over a snapshot.

**Dead theories — still dead, do not re-chase:** H1 heap/GC (flat heap, twice confirmed) · H2 broadcast storm (zero `[BROADCAST]`) · M0 saturation (throttling = 0) · Atlas connection cap (14 of 500) · CPU/event-loop (0%, calm) · network/CDN (`/health` steady) · connection warm-up cost (cold misses are 0.3s after a restart) · the response cache being stripped (no broadcasts fired).

### What shipped 2026-07-22 — the fix

> ⚠️ **This fix failed** (verified 2026-08-02). The path it hardened — explicit retire-then-replace — was never the one that leaked; the driver's auto-resume `close` event was, and it kept creating orphans. Kept for history.

Verified in production immediately after deploy (`7b4a6ce`, instance `brk96`):

```
before  pool=open:14/inUse:10/pending:4  poolWait=avg:12140ms/max:29480ms  + [HEALTH-WARN]
after   pool=open:4/inUse:0/pending:0    poolWait=avg:105ms/max:105ms      no warnings
🟢 Change Stream initialized. live=1
```

Seven never-requested product ids (guaranteed cache misses) returned in 0.42-0.81s, matching `/health`. Before the deploy the same test gave 28.6-30.8s. **But a restart alone would produce this too** — the durable proof is `changeStreams=` staying at `1` over the coming week.

`server/core.js`, one function:

- **`setupChangeStream` no longer orphans streams.** Each stream's handlers are now bound to *that* stream and guarded with an identity check (`stream === changeStreamInstance`), instead of referencing the module-level variable — which is how a retired stream's late `close` event came to null out its healthy successor. A stream being retired now has `removeAllListeners()` called **before** `close()`, so teardown can't re-enter `setupChangeStream` and start another cycle.
- **`changeStreams=N` gauge** in `[HEALTH]`, and `change_streams=N>1` in `[HEALTH-WARN]`. The counter that would have made this a five-minute diagnosis.
- **`🟢 Change Stream initialized. live=N`** so a leak shows up in the same grep as the reconnect that caused it.
- **The change stream's own 30s `getMore` is excluded from `[MONGO-SLOW]`** (counted as `awaits:` instead). It was pinning `mongoCmd max` at ~30000ms and keeping `[HEALTH-WARN]` on permanently — an always-on warning hides the real ones.
- Graceful shutdown detaches listeners before closing, so it can't spawn a fresh stream mid-teardown.

`maxPoolSize` was deliberately **not** raised: it would only have delayed the ceiling and hidden the leak longer.

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
- `d27dad6` — **Change stream removed; write-path notifier** (2026-08-02). See the STATUS at the top.
- `cf693d6` — **singleFlight ownership check** (2026-08-02): cleanup releases only its own in-flight slot.
- `8b591c3` — **`waitQueueTimeoutMS: 10000`** (2026-08-02): pool checkouts fail fast and visibly instead of waiting forever.
- `5d68fe7` — **Incident recorder.** New `[STALL]`, `[HEALTH-WARN]`, `[BROADCAST]` logs so a recurrence records its own cause (see the log table). The `[HEALTH]` line gained `rss` and `loop=p99/max` (event-loop delay).
- `5be5508` — **Dependabot remediation.** All prod-relevant criticals/highs cleared (`npm audit fix` in `server/` + `web/`; `next`→14.2.35; `jspdf`→4.2.1).
- `197e747` — **Change stream fixed.** It had watched collection `"products"` but data lives in `"test"`, so it never fired. Now uses `Product.watch()` and invalidates the response cache on change. NOTE: this **re-activated H2 broadcasts** (see Still open).
- `a2cba64` — **The fix.** Single-flight + short-TTL response cache (`server/utils/responseCache.js`) on getAll, category, nav, site-stats, seo-text. N concurrent identical requests collapse to one Mongo op + one serialize. This resolved the slowness.

### Still open / deferred (a new session can pick these up)
- **WS push delivery is broken at Render's edge (pre-existing; measured 2026-08-02).** Instrumented sockets against both `wss://hybrid-app-1-2haj.onrender.com` and `wss://www.lavangroup.co.il`: client→server frames DO arrive (a garbage frame produced the server's parse-error log at 02:40:30), but **zero server→client frames were ever delivered** — products and categories broadcasts to two simultaneously-open, live-confirmed sockets produced nothing, and no heartbeat ping was ever observed client-side — and every socket is killed at **~10.7s** (close code 1006). The pre-fix logs show the same 10s connect/disconnect churn, so this long predates the 2026-08-02 change and is **not** a regression. Net effect: the "live push" feature has likely never delivered in production; open tabs stay fresh via localStorage TTL (5 min), refetch-on-focus (2 min threshold) and the 60s server cache, which is why nobody noticed. If instant push is ever genuinely wanted: investigate with Render support / try SSE or polling. Do **not** re-add a change stream for it.
- **Broadcast debounce (server-only).** Downgraded again 2026-08-02: broadcasts now fire only from API product writes (`notifyProductChange`) and client `REQUEST_*` messages — the change-stream trigger is gone, so bursts require deliberate bulk admin edits. Only act if `[BROADCAST]` lines actually cluster; then coalesce a burst into one rebuild after ~1-2s of quiet.
- **Stale-set race in `responseCache` (minor, known, 2026-08-02).** A read that started *before* a write can settle *after* the write's `clear()` and cache its pre-edit result for up to the 60s TTL. Bounded by the TTL, and the write-path broadcast still pushes fresh data to open tabs. The fix would be a per-key epoch check in `set()`; not worth it unless ≤60s post-edit staleness ever matters.
- **Bounded cache.** `responseCache` evicts lazily (on access) with no size cap. It holds `product:<id>` (334 products) on top of `category:` / `seo:<name>`. Measured `cacheKeys=445` on 2026-07-22, drifting up by ~1/hour — nowhere near a problem, and heap is flat at ~85MB. Leave it. Revisit only if `cacheKeys` reaches the tens of thousands, which would mean crawler-driven key growth, not catalog size.
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
| `HEALTH` | **Start here.** Grab the 2-3 lines nearest the slow window — it summarises everything. Check `awaits:` (must be `0` since 2026-08-02) and `inUse:` vs `maxPoolSize` first. |
| `POOL` | **Jackpot.** A connection checkout waited >1s → it's the pool (H3). This is what 2026-07-22 and 2026-08-02 turned out to be. |
| `MONGO-SLOW` | A Mongo round-trip took >1s → the wire/driver path. getMores ≥27s are excluded (counted as `awaits:`, which must be 0 now), so anything here is real. |
| `Change Stream` | **Must return nothing** — the stream was removed 2026-08-02. ANY hit means a watch was reintroduced; treat it as the leak. (Historically: `closed` lines sharing one timestamp = streams alive.) |
| `STALL` | The event loop blocked → the *2026-06-18* CPU bug, not the pool one. Read `oldest=[…]`. |

Also worth a look: `HEALTH-WARN` (any alarm), `BROADCAST` (bulk-write storms), `SLOW` (which endpoint), `REQ-ERR` (stack traces).

### Step 2 — The 30-second discriminator

`/health` (`core.js`) returns a static string and never touches Mongo. Compare it to a Mongo-backed endpoint:

```bash
URL=https://hybrid-app-1-2haj.onrender.com
for i in 1 2 3; do curl -s -o /dev/null -w "health  %{time_total}s\n" "$URL/health"; done
for i in 1 2 3; do curl -s -o /dev/null -w "product %{time_total}s\n" "$URL/api/products/670463ee7e9f9f8a73556f37"; done
```

- **`/health` fast + product slow** → the process and network are fine; it's the Mongo path. (2026-07-15: 0.31s vs 15.9s. 2026-07-22: 0.40s vs 29.0s.)
- **Both slow** → the process/network really is the bottleneck; follow the `[STALL]` trail.

**Request each Mongo-backed URL twice**, and use a *fresh* product id the site has not served recently. The response cache has a 60s TTL, so a second identical request is a cache hit that never reaches Mongo — on 2026-07-22 the same id gave 29.0s then 1.0s. A "fast" reading from a warm key proves nothing. `/api/products/getAll` cold was **28.8s**, so do not assume the problem is the product endpoint.

### Step 3 — Read the decomposition

`[HEALTH]` carries the whole picture. **request time = pool wait + command duration + our own code**:

```
[HEALTH] uptime=... loop=p99:X/max:Y mongo=connected
         pool=open:N/inUse:N/pending:N poolWait=avg:X/max:Y mongoCmd=max:X/slow:N
```

The readings are mutually exclusive — that is the whole point of the instrumentation:

This table was written before the instrumentation had ever fired in anger. **On its first real use (2026-07-22) row 1 was the hit** — the procedure works, so trust it.

| Reading | Conclusion | Where to look |
|---|---|---|
| `poolWait max` ≈ request time | **Pool starvation (H3)** — the 2026-07-22 AND 2026-08-02 cause | Read `awaits:` on the same line: ~60 per awaitData cursor per 30-min window (600 = ten). Do **not** trust `changeStreams=` — on 2026-08-02 it read `1` with 10 cursors alive, and `0` with 5. `inUse` pinned at 10 = connections held, not used. |
| `mongoCmd max` ≈ request time | **The round-trip itself** | Atlas proved Mongo isn't busy, so the time is on the wire / in the driver's socket handling: dead sockets, DNS/SRV, TLS. |
| **Both ≈ 0 while requests take 10s** | **The time is in OUR code** — everything above was misattributed | Time the code *around* the `await` in `getProduct`, and the middleware chain. Surprising but decisive. |
| `loop=p99` high / `[STALL]` present | CPU-bound — the *2026-06-18* bug pattern, not the current one | Read `oldest=[…]` for the endpoint. |

### Step 4 — Record `uptime=`

**Write down the `uptime=` value from `[HEALTH]` when it starts lagging.** It was **644h** on 2026-07-15 and **167h** on 2026-07-22 — so onset is *not* time-based, it tracks how many Atlas reconnects have happened. If a future recurrence has a similar spread, look for another event-counted leak rather than a timer.

### Don't bother with

- **Atlas.** Exonerated twice. Its "~0.3 ops/s, idle" reading was real — and was *caused by* the leak (10 cursors returning every 30s). **A quiet Atlas is consistent with the app being broken**; it does not clear the app. Only revisit if `[MONGO-SLOW]` fires *and* you need to split wire-time from Mongo-time.
- **The dead theories** listed in STATUS. Re-deriving them is how months got burned.

### Caveat on timing

**A restart alone clears this symptom for weeks** — "it's fast now" right after a deploy proves nothing; that reflex is how the bug survived months. Since 2026-08-02 the durable check is simply the baseline gauges in every `[HEALTH]`: `awaits:0`, `changeStreams=0`, `inUse` idling at 0-2. (Historical: before removal, leaked cursors reached 3-5 within hours of a disconnect and ~10 within days.)

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

> ⚠️ **Read the symptom list above with suspicion.** As of 2026-07-22 we know "clicking a single product" was never special: **every** request that missed the 60s response cache took 15-30s, `getAll` included. Products and categories felt fine only because their keys stay warm and the frontend keeps a 5-min localStorage copy. Re-confirmed identically on 2026-08-02 (cold misses 26.7-29.7s while `/health` held 0.3-0.6s). See STATUS.
>
> The original theory here was *runtime state drift (heap growth, stale connections, stacked timers)*. The 35-day flat-heap trace killed the heap half, and the phrasing was vague — but **"stale connections / stacked timers" was the closest anyone got**: the real cause was stacked change-stream cursors holding stale pool connections. Worth remembering that the vague early hunch was directionally right and got discarded wholesale along with the part that was wrong. Still true: it is **not** a static code bug, **not** Render cold-start, **not** Atlas auto-pause.

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

### H2 — WebSocket broadcasts on every product change — ⚠️ downgraded again (2026-08-02)

Was dormant (change stream watched the wrong collection), then live via the stream (`197e747`), and since 2026-08-02 fires **only** from API product writes (`notifyProductChange` in the controllers) and client `REQUEST_*` messages — the change-stream trigger no longer exists. One admin save = one broadcast; a storm requires deliberate bulk edits. Only act if `[BROADCAST]` lines actually cluster; the debounce idea in "Still open" stands. The original coordinated FE option (`PRODUCTS_INVALIDATE` ping + a `web/src/lib/websocket.ts` handler that `dispatch(fetchProducts())`) is still valid if lighter payloads are wanted.

### H3 — Mongo connection-pool starvation — ✅ CONFIRMED twice; RESOLVED by removing the stream (2026-08-02)

**This was it, both times.** Ranked third, called "unlikely" as late as 2026-07-15, and correct all along.

- `maxPoolSize: 10` in `MONGO_OPTIONS` (`server/core.js`). A healthy change stream held one slot continuously — known and fine; the leak held one *per orphan*, up to all 10.
- The `7b4a6ce` lifecycle fix failed because the driver's auto-resume emits `close` while the stream lives (see the 2026-08-02 STATUS). Resolution: **no stream exists anymore** — nothing in the codebase holds a pool connection at idle.
- Bumping `maxPoolSize` was deliberately never done: it would only have delayed the ceiling and hidden the leak longer. `waitQueueTimeoutMS: 10000` now bounds checkout waits instead.

### H5 — Stacked retries — moot since 2026-08-02

The retry machinery was deleted along with the stream. (Historically: `15e91cf`'s `retryScheduled` guard held — each burst produced exactly one new stream — but that new stream orphaned its self-healed predecessor every time, which is what actually accumulated.)

## What is in the logs and what each line means

| Log prefix | Source | Meaning |
|---|---|---|
| `✅ MongoDB connected: <host>/<db>` | `core.js:167` | Mongoose finished connecting. The host/db lets you confirm the right Atlas cluster after long gaps. |
| `⚠️ MongoDB disconnected` / `🔄 MongoDB reconnected` | `core.js:155-159` | Atlas dropped/recovered. Occasional is fine. Frequent (multiple per hour) is not. |
| `❌ MongoDB connection error event: <msg>` | `core.js:161-163` | Atlas threw. Read the message. |
| `[HEALTH] uptime=Xh mem=… rss=… loop=p99:A/max:B mongo=<state> pool=open:N/inUse:N/pending:N poolWait=avg:X/max:Y mongoCmd=max:X/slow:N changeStreams=N/awaits:N` | `core.js` `startHealthDiagnostics` | Every 30 min. `loop` = event-loop delay (the CPU-bound signal). `poolWait` = time spent waiting for a Mongo connection; `mongoCmd` = the command round-trip. **`changeStreams=` and `awaits:` must both be `0`** (stream removed 2026-08-02). `awaits` counts driver-side ≥27s getMores (~60 per awaitData cursor per window) and is the trustworthy one — the hand-kept gauge read `1` with ten cursors alive. Window stats reset each log; `pool=` and `changeStreams=` are live gauges. |
| `[HEALTH-WARN] <reasons> rss=RMB cacheKeys=N pool=…` | `core.js` `startHealthDiagnostics` | Slow-burn alarm: heap>300MB, mongo not connected, loop p99>500ms, pool wait >1s, pending ≥ maxPoolSize, a failed checkout, or a command >1s. Greppable; means investigate. |
| `[POOL] checkout waited Xms open:N/inUse:N/pending:N maxPoolSize=N` | `core.js` `attachPoolMonitoring` | **A connection checkout took >1s** — requests are queuing for the pool rather than running queries (H3). Rate-limited to one line / 10s. |
| `[MONGO-SLOW] <cmd> <ok\|FAILED> Xms pool=…` | `core.js` `attachCommandMonitoring` | **A Mongo command round-trip took >1s** as the driver saw it. With a calm `[POOL]`, the time is on the wire / in Mongo — the half Atlas cannot show on M0. Rate-limited to one line / 10s. |
| `[STALL] blocked~Xms inflight=N oldest=[...] mem=... mongo=... wsClients=N broadcast=<yes/no> cacheKeys=N` | `core.js` `startIncidentRecorder` | Event-loop blocked >~700ms. **The single most useful line on a recurrence** — names what was running. |
| `[BROADCAST] <products\|categories> <ms>ms [id=...]` | `core.js` broadcast fns | A WebSocket broadcast took >200ms (fires on API product writes and client `REQUEST_*` messages). Clusters of these = bulk product update → debounce (H2). |
| `[REQ] <method> <url> <status> <ms>ms mongo=<state> [SLOW]` | `core.js`, request logger | Slow or error response. Useful, but background stalls won't appear here — use `[STALL]`. |
| `[REQ-ERR] <route>: <Error stack>` | `productController.js` | Server-side error in a product endpoint. Full stack, not just `.message`. |
| `🟢 Change Stream initialized.` | *(removed 2026-08-02)* | **This line can no longer be printed.** If it appears, someone reintroduced a watch — re-read the STATUS at the top before doing anything else. |
| `⚠️ Change Stream closed, will retry...` | *(removed 2026-08-02)* | Same — historical only. (This was the line that cracked 2026-07-22: `closed` lines sharing one second = streams alive; clusters of 10-12 during the 2026-08-02 verification.) |
| `🟢 New WebSocket client connected` / `🔴 WebSocket client disconnected` | `core.js:256, 279` | Front-end browser tabs opening/closing. |

## Things to avoid

- **Do not** suggest `app.set('trust proxy', true)` — security hole. Always `1` for single-Render-proxy setups.
- **Do not** add a logging library (winston/pino). Render's log stream captures `console.*` natively; adding a library means new failure modes for no win.
- **Do not** propose Redis as the first move — it's another paid service. Bounded in-memory or Mongo-backed alternatives exist.
- **Do not** rewrite the WebSocket layer wholesale. The current design is fine; just send lighter payloads.
- **Do not** reintroduce `Product.watch()` or any MongoDB change stream. Three pool-starvation incidents in three months came from that one mechanism on M0's flaky networking, and two lifecycle fixes died on the driver's auto-resume `close` semantics. The write-path notifier (`changeNotifier.js`) covers the product-update need; if a future feature truly requires a stream, it must be designed against those semantics and watched via `awaits:`.
- **Do not** treat a single `[REQ] ... SLOW` line as the issue returning. Look for a pattern over time and corroborating `[HEALTH]` or Atlas metrics.
- **Do not** delete the `tmpclaude-*-cwd` directories at the repo root without checking — they're stale CWD markers from previous sessions, but `.gitignore` already covers them; just leave them be.

## Project quirks worth knowing

- Schema fields are in **Hebrew** (e.g. `שם` = name, `מחיר רגיל` = regular price, `קטגוריות` = categories). The collection itself is named `"test"` (`server/models/productModel.js:41`) — a legacy name, not a typo. Don't rename it without coordinating data migration.
- Category strings are `"Main"` or `"Main > Sub"` joined by `,` for products in multiple categories. Parsing lives in `server/controllers/categoryController.js`.
- The frontend has its own 5-minute localStorage cache for products and categories (`web/src/lib/redux/actions/`). When debugging "data not loading," consider whether the client is showing stale cached data vs. a real server failure.
- `combined.js` runs Express *and* the Next.js handler in one process on Render to save money. Long-running CPU work in the API directly delays page renders.

## Memory and plan files

This runbook is self-contained — the ranked hypotheses, evidence, and deferred fixes are all above. An earlier local planning document was folded in here by `7d1a235` and no longer exists; don't go looking for one.
