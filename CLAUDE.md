# CLAUDE.md — runbook for the recurring "data not loading" issue

This file exists because **the same problem keeps coming back every couple of months**. Read it before suggesting changes — most of the obvious moves have already been tried, and there are infra constraints that rule out the easy answers.

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

The "redeploy fixes it" fingerprint means **runtime state drift** — heap growth, stale connections, stacked retry timers, or accumulated per-IP rate-limit buckets. It is **not** a static code bug. It is **not** Render cold-start (starter plan doesn't spin down). It is **not** Atlas auto-pause (M0 doesn't pause as long as it gets traffic).

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
| High `ms`, `mongo=connected`, no `[REQ-ERR]` | Node event-loop blocked or Mongo throttled | Check nearest `[HEALTH]` for memory, then Atlas Metrics |
| `[REQ-ERR]` appears with stack | Deterministic bug | Read the stack — fix at the line shown |
| **No `[REQ]` line at all** for the slow click | Request never reached the server | Check Render Events tab (instance restart? deploy?), CDN, or frontend timeout |

### Step 3 — Check the closest `[HEALTH]` line

Logged every 30 min, format:

```
[HEALTH] uptime=Xh mem=YMB/ZMB mongo=connected
```

- `mem` consistently > 350MB before a slowness window → **heap pressure / GC stalls** (H1 below)
- `mem` flat but slowness persists → likely Mongo-side (H4) or broadcast saturation (H2)

### Step 4 — Check MongoDB Atlas

Atlas dashboard → cluster → **Metrics** tab. Look at the past week:
- **Operation Execution Time** — spikes mean Mongo is the bottleneck
- **Connections** — approaching the M0 cap (500) means the pool is leaking or change-stream is misbehaving

### Step 5 — Match the timeline

Cross-reference Render `[REQ] ... SLOW` timestamps with Atlas metric spikes. If they coincide, the cause is Mongo-side. If `[REQ]` is slow but Atlas is calm, it's Node-side.

## Open hypotheses (not yet fixed)

Ordered by how likely they are to be the next culprit when symptoms return:

### H1 — Heap pressure + GC stalls (most likely on long uptimes)

- `express-rate-limit` uses the default in-memory store (`server/middleware/rateLimiter.js`). Buckets accumulate one entry per unique IP over weeks. Bots and crawlers inflate this.
- The category cache in `server/controllers/categoryController.js:5-10` holds the full structure (including embedded products in the `full` cache slot — populated by the `/api/categories` route, though nothing on the frontend currently calls it).
- 460MB heap + 0.5 CPU = GC pauses become disproportionately expensive.

**Next moves if confirmed:** bounded rate-limit store (e.g. `rate-limit-mongo`), drop products from the `full` cache slot or remove the `/api/categories` route entirely since nothing uses it.

### H2 — WebSocket broadcasts on every product change (partially mitigated)

- `broadcastProductsUpdate(null)` (fallback path) still does `Product.find({}).lean().limit(1000)` and sends every product to every connected client.
- Triggered by: change-stream when no product id is available, and by admin clients sending `REQUEST_PRODUCTS_UPDATE` after create/delete.

**Next moves if confirmed:** change the fallback to send a `PRODUCTS_INVALIDATE` ping; add a handler in `web/src/lib/websocket.ts` that calls `dispatch(fetchProducts())`. This is a coordinated backend+frontend change — that's why it was deferred.

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
| `[HEALTH] uptime=Xh mem=YMB/ZMB mongo=<state>` | `core.js:127-140` | Every 30 min. Track `mem` over a week to see drift. |
| `[REQ] <method> <url> <status> <ms>ms mongo=<state> [SLOW]` | `core.js`, request logger | Slow or error response. The most useful single log when triaging. |
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
