/**
 * core.js - Shared logic between server.js (dev) and combined.js (production)
 * This eliminates code duplication and ensures both environments work the same.
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const { monitorEventLoopDelay } = require("perf_hooks");
const Product = require("./models/productModel");
const cache = require("./utils/responseCache");
const { getCategoriesNav, invalidateCategoryCache } = require("./controllers/categoryController");

// ============ INCIDENT RECORDER STATE ============
// Shared state so a future slowdown logs its own cause (see startIncidentRecorder).
const inFlightRequests = new Map(); // reqId -> { method, url, start }
let reqSeq = 0;
let broadcastDepth = 0;             // >0 while a change-stream broadcast is running
let wssRef = null;                  // live WebSocket server ref, for client count

// Rate Limiting
const {
  generalLimiter,
  authLimiter,
  paymentLimiter,
  emailLimiter,
} = require("./middleware/rateLimiter");

// Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const materialGroupRoutes = require("./routes/materialGroupRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const emailRoutes = require("./routes/emailRoutes");
const categoryImagesRoutes = require("./routes/categoryImagesRoutes");
const siteStatsRoutes = require("./routes/siteStatsRoutes");
const imageProxyRoutes = require("./routes/imageProxyRoutes");
const categorySeoTextRoutes = require("./routes/categorySeoTextRoutes");

// ============ CONFIGURATION ============
const CORS_ORIGINS = [
  "http://localhost:3000",
  "https://lavangroup.co.il",
  "https://www.lavangroup.co.il",
];

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 30000, // Close connections idle for 30s+ to prevent stale connections
  // Emit command events so we can time the actual Mongo round-trip (see
  // attachCommandMonitoring). Needed to tell "the driver waited" apart from
  // "Mongo/the network was slow" — Atlas's own charts can't show this on M0.
  // Overhead is negligible here: the cluster does ~0.3 ops/sec.
  monitorCommands: true,
};

const CSP_HEADER = 
  "default-src 'self'; " +
  "img-src 'self' https: data:; " +
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com https://cdn.enable.co.il https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com; " +
  "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com https://cdn.enable.co.il https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com; " +
  "style-src 'self' 'unsafe-inline' https://vee-crm.com https://www.gstatic.com https://cdn.enable.co.il; " +
  "font-src 'self' https: data:; " +
  "connect-src 'self' https://vee-crm.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://hybrid-app-1-2haj.onrender.com https://lavangroup.co.il https://firestore.googleapis.com wss://hybrid-app-1-2haj.onrender.com https://identitytoolkit.googleapis.com https://www.lavangroup.co.il https://securetoken.googleapis.com https://api.cloudinary.com https://cdn.enable.co.il https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com; " +
  "frame-src 'self' https://*.firebaseapp.com https://www.googletagmanager.com; " +
  "worker-src 'none'; " +
  "media-src 'none'; " +
  "frame-ancestors 'none'; " +
  "object-src 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self';";

// ============ MIDDLEWARE SETUP ============
function setupMiddleware(app) {
  // Trust Render's edge proxy so req.ip is the real client IP (from X-Forwarded-For).
  // Required for express-rate-limit to key on per-user IPs instead of the shared proxy IP.
  // Use 1 (not true) so clients can't spoof X-Forwarded-For end-to-end.
  app.set('trust proxy', 1);

  // CORS
  app.use(cors({
    origin: CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }));

  // Body parser with 10mb limit for base64 images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Security headers
  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", CSP_HEADER);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
    next();
  });

  // Request logger — logs slow (>1000ms) or error responses, plus everything in dev.
  // Also tracks in-flight requests so the [STALL] recorder can name what was
  // running when the event loop blocked.
  app.use((req, res, next) => {
    const start = Date.now();
    const id = ++reqSeq;
    inFlightRequests.set(id, { method: req.method, url: req.originalUrl, start });
    const done = () => inFlightRequests.delete(id);
    res.on('close', done); // fires even if the client disconnects before finish
    res.on('finish', () => {
      done();
      if (req.path === '/health') return;
      const ms = Date.now() - start;
      const slow = ms > 1000;
      const bad = res.statusCode >= 400;
      if (slow || bad || process.env.NODE_ENV !== 'production') {
        const mongoState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';
        console.log(`[REQ] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms mongo=${mongoState}${slow ? ' SLOW' : ''}`);
      }
    });
    next();
  });
}

// ============ ROUTES SETUP ============
function setupRoutes(app) {
  // Apply general rate limiting to all API routes
  app.use("/api", generalLimiter);

  // Apply specific rate limits to sensitive routes
  app.use("/api/users", authLimiter, userRoutes);
  app.use("/api/payment", paymentLimiter, paymentRoutes);
  app.use("/api/email", emailLimiter, emailRoutes);

  // Regular routes
  app.use("/api/products", productRoutes);
  app.use("/api", categoryRoutes);
  app.use("/api/materialGroups", materialGroupRoutes);
  app.use("/api/category-images", categoryImagesRoutes);
  app.use("/api/images", imageProxyRoutes);
  app.use("/api/site-stats", siteStatsRoutes);
  app.use("/api/category-seo-text", categorySeoTextRoutes);

  // Health check
  app.get("/health", (req, res) => res.status(200).send("ok"));

  // Block suspicious paths
  app.use((req, res, next) => {
    const blockedFiles = ["/BitKeeper", "/.hg", "/.bzr", "/.darcs"];
    if (blockedFiles.includes(req.path)) {
      return res.status(404).send("Not found");
    }
    next();
  });
}

// ============ MONGO POOL INSTRUMENTATION ============
// Why this exists: on 2026-07-15 Mongo reads took 10-20s while BOTH ends sat
// idle. The app: CPU ~0%, loop p99 23ms, no [STALL]. Atlas: throttling flat
// zero, connections flat at 4, ~0.3 ops/s on a 677KB dataset. /health (no
// Mongo) held 0.31s throughout, so it wasn't the network either. A restart
// cleared it — the root cause was never found, and it is expected back.
//
// The time was going somewhere between Express and Atlas, and nothing logged
// could say where. These counters close that gap.
//
// NOTE: this is NOT proof of H3 (pool starvation). Atlas showed connections
// flat at 4 and never near maxPoolSize=10 — if checkouts were really queuing,
// the driver would have opened more. So H3 looks unlikely; this instrumentation
// exists to KILL it cleanly rather than to confirm it:
//   wait max ~= request time -> H3 is real after all; the pool is the bottleneck.
//   pending >= maxPoolSize   -> a genuine backlog (1-2 in flight is normal).
//   wait ~0 while slow       -> H3 is dead. Read mongoCmd instead (below).
// The driver emits CMAP events on the MongoClient by default; no option needed.
const poolStats = {
  created: 0,          // connectionCreated
  closed: 0,           // connectionClosed
  checkOutStarted: 0,
  checkedOut: 0,
  checkedIn: 0,
  checkOutFailed: 0,
  waitQueue: [],       // FIFO start timestamps of in-flight checkouts
  waitMaxMs: 0,        // per-window
  waitSumMs: 0,        // per-window
  waitCount: 0,        // per-window
};

// The driver's wait queue is FIFO and maxPoolSize is 10, so this only ever
// bounds pathology (an unpaired event). Without a cap a leak here would be the
// exact kind of slow drift this file exists to catch.
const POOL_WAIT_QUEUE_CAP = 256;

// Report a slow checkout the moment it happens rather than waiting up to 30min
// for the next [HEALTH] line. This matters specifically for H3: the pool-wait
// signature does NOT block the event loop, so [STALL] never fires for it and
// [HEALTH] alone could hide a 10s stall between windows.
const POOL_SLOW_CHECKOUT_MS = 1000;
const POOL_LOG_EVERY_MS = 10000; // rate limit: one line per 10s, not one per request
let lastPoolLogAt = 0;

function attachPoolMonitoring(client) {
  const settle = () => {
    const started = poolStats.waitQueue.shift();
    if (started === undefined) return;
    const waited = Date.now() - started;
    if (waited > poolStats.waitMaxMs) poolStats.waitMaxMs = waited;
    poolStats.waitSumMs += waited;
    poolStats.waitCount++;

    const now = Date.now();
    if (waited > POOL_SLOW_CHECKOUT_MS && now - lastPoolLogAt > POOL_LOG_EVERY_MS) {
      lastPoolLogAt = now;
      const pool = poolSnapshot();
      console.log(
        `[POOL] checkout waited ${waited}ms` +
        ` open:${pool.open}/inUse:${pool.inUse}/pending:${pool.pending}` +
        ` maxPoolSize=${MONGO_OPTIONS.maxPoolSize}`
      );
    }
  };

  client.on('connectionCreated', () => { poolStats.created++; });
  client.on('connectionClosed', () => { poolStats.closed++; });
  client.on('connectionCheckOutStarted', () => {
    poolStats.checkOutStarted++;
    if (poolStats.waitQueue.length >= POOL_WAIT_QUEUE_CAP) poolStats.waitQueue.shift();
    poolStats.waitQueue.push(Date.now());
  });
  client.on('connectionCheckedOut', () => { poolStats.checkedOut++; settle(); });
  client.on('connectionCheckedIn', () => { poolStats.checkedIn++; });
  client.on('connectionCheckOutFailed', () => { poolStats.checkOutFailed++; settle(); });
}

// Instantaneous view, safe to call from any log line.
// Clamped at 0: the CMAP spec pairs every checkOutStarted with exactly one
// checkedOut/checkOutFailed, but if that ever slipped, a drifting counter would
// print a phantom backlog forever and send the next session chasing a ghost.
// A wrong diagnostic is worse than none, so prefer under-reporting.
function poolSnapshot() {
  const open = Math.max(0, poolStats.created - poolStats.closed);
  const inUse = Math.max(0, poolStats.checkedOut - poolStats.checkedIn);
  const pending = Math.max(0, poolStats.checkOutStarted - poolStats.checkedOut - poolStats.checkOutFailed);
  return { open, inUse, pending };
}

// ============ MONGO COMMAND TIMING ============
// Completes the decomposition of a slow request:
//     request time = pool wait  +  command duration  +  our own code
// Pool wait comes from poolStats above; this measures the command round-trip as
// the driver sees it (wire send -> reply received). That matters because Atlas
// ruled itself out on 2026-07-15: Operation Throttling was flat zero for two
// months, connections sat at 4 (never near maxPoolSize=10), opcounters ~0.3/s
// on a 677KB dataset. So Mongo was idle while our reads took 10-20s, and M0
// does not expose Operation Execution Time to prove where the time went.
// Next recurrence, the two numbers say which it is:
//   cmd duration ~= request time -> the round-trip itself (network/driver path)
//   pool wait    ~= request time -> queuing for a connection (H3)
//   neither      -> the time is in our code, not Mongo at all
const cmdStats = { maxMs: 0, slowCount: 0, lastLogAt: 0 };
const CMD_SLOW_MS = 1000;
const CMD_LOG_EVERY_MS = 10000; // rate limit; a stall would otherwise log per op

function attachCommandMonitoring(client) {
  const onEnd = (label) => (ev) => {
    const ms = Math.round(ev.duration);
    if (ms > cmdStats.maxMs) cmdStats.maxMs = ms;
    if (ms <= CMD_SLOW_MS) return;
    cmdStats.slowCount++;
    const now = Date.now();
    if (now - cmdStats.lastLogAt <= CMD_LOG_EVERY_MS) return;
    cmdStats.lastLogAt = now;
    const pool = poolSnapshot();
    console.log(
      `[MONGO-SLOW] ${ev.commandName} ${label} ${ms}ms` +
      ` pool=open:${pool.open}/inUse:${pool.inUse}/pending:${pool.pending}`
    );
  };
  client.on('commandSucceeded', onEnd('ok'));
  client.on('commandFailed', onEnd('FAILED'));
}

// ============ HEALTH DIAGNOSTICS ============
const MONGO_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

function startHealthDiagnostics() {
  // Event-loop delay histogram. When the single 0.5-CPU process is CPU-bound
  // (the head-of-line-blocking signature), p99 lag spikes into the hundreds of
  // ms / seconds; if it stays near 0 while requests are slow, the bottleneck is
  // Mongo-side instead. This is the key discriminator on the next recurrence.
  const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  eventLoopDelay.enable();

  const logHealth = () => {
    const mem = process.memoryUsage();
    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const uptimeH = (process.uptime() / 3600).toFixed(1);
    const mongoState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';
    // Nanoseconds -> milliseconds for the event-loop delay percentiles.
    const loopP99 = Math.round(eventLoopDelay.percentile(99) / 1e6);
    const loopMax = Math.round(eventLoopDelay.max / 1e6);
    const pool = poolSnapshot();
    const waitAvg = poolStats.waitCount ? Math.round(poolStats.waitSumMs / poolStats.waitCount) : 0;
    console.log(
      `[HEALTH] uptime=${uptimeH}h mem=${heapMB}MB/${heapTotalMB}MB rss=${rssMB}MB` +
      ` loop=p99:${loopP99}ms/max:${loopMax}ms mongo=${mongoState}` +
      ` pool=open:${pool.open}/inUse:${pool.inUse}/pending:${pool.pending}` +
      ` poolWait=avg:${waitAvg}ms/max:${poolStats.waitMaxMs}ms` +
      ` mongoCmd=max:${cmdStats.maxMs}ms/slow:${cmdStats.slowCount}`
    );

    // Slow-burn alarm: flag gradual death (leak / DB drop / sustained CPU) the
    // moment a threshold is crossed, so it's greppable instead of needing a watch.
    const MEM_WARN_MB = 300;
    const POOL_WAIT_WARN_MS = 1000;
    const reasons = [];
    if (heapMB > MEM_WARN_MB) reasons.push(`mem=${heapMB}MB>${MEM_WARN_MB}`);
    if (mongoState !== 'connected') reasons.push(`mongo=${mongoState}`);
    if (loopP99 > 500) reasons.push(`loop_p99=${loopP99}ms`);
    // The H3 alarm: a checkout that waited seconds means requests are queuing for
    // a connection, not running queries — the line that would have named the
    // 2026-07-15 cause outright. Wait time is the real signal; `pending` alone is
    // not, because 1-2 in-flight checkouts at the instant of a 30-min sample is
    // normal under any load. Only flag a backlog deeper than the pool itself.
    if (poolStats.waitMaxMs > POOL_WAIT_WARN_MS) reasons.push(`pool_wait_max=${poolStats.waitMaxMs}ms`);
    if (pool.pending >= MONGO_OPTIONS.maxPoolSize) reasons.push(`pool_pending=${pool.pending}>=maxPoolSize`);
    if (poolStats.checkOutFailed > 0) reasons.push(`pool_checkout_failed=${poolStats.checkOutFailed}`);
    // A slow round-trip with a calm pool means the time is on the wire or in
    // Mongo — the half of the decomposition Atlas can't show us on M0.
    if (cmdStats.maxMs > POOL_WAIT_WARN_MS) reasons.push(`mongo_cmd_max=${cmdStats.maxMs}ms`);
    if (reasons.length) {
      console.log(
        `[HEALTH-WARN] ${reasons.join(' ')} rss=${rssMB}MB cacheKeys=${cache.size()}` +
        ` pool=open:${pool.open}/inUse:${pool.inUse}/pending:${pool.pending}`
      );
    }

    eventLoopDelay.reset(); // per-window percentiles, not cumulative
    // Same for pool wait and command timing: per-window, so a spike can't be
    // diluted by weeks of healthy ops. open/inUse/pending are live gauges of
    // current state, not window stats — they must NOT reset.
    poolStats.waitMaxMs = 0;
    poolStats.waitSumMs = 0;
    poolStats.waitCount = 0;
    cmdStats.maxMs = 0;
    cmdStats.slowCount = 0;
  };

  // Log on startup
  logHealth();
  // Log every 30 minutes
  setInterval(logHealth, 30 * 60 * 1000);

  // Start the sudden-stall recorder alongside the slow-burn health log.
  startIncidentRecorder();
}

// ============ INCIDENT RECORDER ============
// A short recursive probe measures how late it fires versus when it was
// scheduled — that lateness IS the event-loop block time. When a block exceeds
// STALL_MS it logs a snapshot the instant the loop recovers, naming what was
// running (in-flight requests, broadcast state, memory, cache size). This
// captures sudden stalls that fall between the 30-min [HEALTH] lines and never
// reach the [REQ] logger (e.g. background broadcast work or GC), so a future
// slowdown records its own cause.
//
// A small probe interval is required: an interval-based tick under-measures a
// block that starts mid-interval. With PROBE_MS=250 the reported time is within
// ~250ms of the true block (a slight underestimate).
function startIncidentRecorder() {
  const PROBE_MS = 250;
  const STALL_MS = 700; // report event-loop blocks longer than ~this (filters SSR/GC noise)
  let expected = Date.now() + PROBE_MS;

  const probe = () => {
    const now = Date.now();
    const blocked = now - expected; // how late this probe fired = loop block time
    expected = now + PROBE_MS;

    if (blocked >= STALL_MS) {
      const mem = process.memoryUsage();
      const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
      const rssMB = Math.round(mem.rss / 1024 / 1024);
      const mongoState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';
      const wsClients = wssRef ? wssRef.clients.size : 0;
      const oldest = [...inFlightRequests.values()]
        .sort((a, b) => a.start - b.start)
        .slice(0, 5)
        .map((r) => `${r.method} ${r.url} ${now - r.start}ms`);

      const pool = poolSnapshot();

      console.log(
        `[STALL] blocked~${blocked}ms inflight=${inFlightRequests.size}` +
        (oldest.length ? ` oldest=[${oldest.join(', ')}]` : '') +
        ` mem=${heapMB}MB/${heapTotalMB}MB rss=${rssMB}MB mongo=${mongoState}` +
        ` wsClients=${wsClients} broadcast=${broadcastDepth > 0 ? 'IN_PROGRESS' : 'no'}` +
        ` cacheKeys=${cache.size()}` +
        ` pool=open:${pool.open}/inUse:${pool.inUse}/pending:${pool.pending}`
      );
    }

    setTimeout(probe, PROBE_MS).unref(); // never keep the process alive for this timer
  };

  setTimeout(probe, PROBE_MS).unref();
}

// ============ DATABASE CONNECTION ============
let changeStreamInstance = null;
let onChangeStreamReady = null;

async function connectDB(onReady) {
  onChangeStreamReady = onReady;

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  // Monitor connection events
  mongoose.connection.on('disconnected', () => {
    console.warn("⚠️ MongoDB disconnected");
  });
  mongoose.connection.on('reconnected', () => {
    console.log("🔄 MongoDB reconnected");
  });
  mongoose.connection.on('error', (err) => {
    console.error("❌ MongoDB connection error event:", err.message);
  });

  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    // Attach pool monitoring before serving. Never let instrumentation take the
    // site down: if the driver internals ever move, log it and carry on.
    try {
      const client = mongoose.connection.getClient();
      attachPoolMonitoring(client);
      attachCommandMonitoring(client);
    } catch (err) {
      console.error('❌ Could not attach Mongo pool monitoring:', err.message);
    }
    startHealthDiagnostics();
    if (onChangeStreamReady) onChangeStreamReady();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    setTimeout(() => connectDB(onReady), 5000);
  }
}

// ============ WEBSOCKET LOGIC ============
function setupWebSocket(wss) {
  wssRef = wss; // expose for the [STALL] recorder's client count

  // Heartbeat mechanism to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('🔴 Terminating dead WebSocket connection');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Broadcast functions
  const broadcastProductsUpdate = async (changedProductId = null) => {
    broadcastDepth++;
    const startedAt = Date.now();
    try {
      let payload;
      let updateType = "PRODUCTS_UPDATED";
      
      if (changedProductId) {
        const changedProduct = await mongoose.model("Product").findById(changedProductId).lean();
        if (changedProduct) {
          payload = changedProduct;
          updateType = "PRODUCT_CHANGED";
        } else {
          payload = await mongoose.model("Product").find({}).lean().limit(1000);
        }
      } else {
        payload = await mongoose.model("Product").find({}).lean().limit(1000);
      }
      
      const message = JSON.stringify({ type: updateType, payload });
      
      let sentCount = 0;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
            sentCount++;
          } catch (err) {
            console.error("❌ Error sending to WebSocket client:", err);
          }
        }
      });
      
      if (sentCount > 0 && process.env.NODE_ENV !== 'production') {
        console.log(`📤 Broadcast sent to ${sentCount} clients (type: ${updateType})`);
      }
    } catch (error) {
      console.error("❌ Error broadcasting product updates:", error);
    } finally {
      broadcastDepth--;
      const dur = Date.now() - startedAt;
      if (dur > 200) console.log(`[BROADCAST] products ${dur}ms id=${changedProductId || 'all'}`);
    }
  };

  const broadcastCategoriesUpdate = async () => {
    broadcastDepth++;
    const startedAt = Date.now();
    try {
      const req = {};
      const res = {
        status: (statusCode) => ({
          json: (data) => {
            if (statusCode !== 200) return;
            if (!data.length) return;
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "CATEGORIES_UPDATED", payload: data }));
              }
            });
          },
        }),
      };
      // Use lightweight nav structure (no embedded products) instead of full tree
      // to avoid recomputing/serializing thousands of nested products on every change
      await getCategoriesNav(req, res);
    } catch (error) {
      console.error("❌ Error broadcasting category updates:", error);
    } finally {
      broadcastDepth--;
      const dur = Date.now() - startedAt;
      if (dur > 200) console.log(`[BROADCAST] categories ${dur}ms`);
    }
  };

  // Connection handler
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    console.log('🟢 New WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        
        if (parsedMessage.type === "REQUEST_PRODUCTS_UPDATE") {
          broadcastProductsUpdate();
        }
        
        if (parsedMessage.type === "REQUEST_PRODUCT_UPDATE" && parsedMessage.productId) {
          broadcastProductsUpdate(parsedMessage.productId);
        }

        if (parsedMessage.type === "REQUEST_CATEGORIES_UPDATE") {
          broadcastCategoriesUpdate();
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    });

    ws.on('close', () => {
      console.log('🔴 WebSocket client disconnected');
    });
  });

  // Change Stream setup
  let retryScheduled = false;
  const scheduleRetry = () => {
    if (retryScheduled) return;
    retryScheduled = true;
    setTimeout(() => {
      retryScheduled = false;
      setupChangeStream();
    }, 5000);
  };

  const setupChangeStream = () => {
    try {
      if (changeStreamInstance) {
        changeStreamInstance.close();
      }

      // Watch the model's actual collection. Mongoose maps Product -> the "test"
      // collection (legacy name, see productModel.js); watching the literal
      // "products" collection meant the stream never fired on real edits.
      changeStreamInstance = Product.watch([], {
        fullDocument: 'updateLookup',
        maxAwaitTimeMS: 30000,
      });

      changeStreamInstance.on("change", async (change) => {
        // A product changed — possibly via a direct DB write, not just our API.
        // Drop the server-side caches so the broadcast and next reads are fresh.
        // (API write paths already invalidate; this covers out-of-band changes.)
        cache.clear("products:all");
        cache.clearPrefix("category:");
        cache.clearPrefix("product:");
        invalidateCategoryCache();

        const productId = change.documentKey?._id;

        if (change.operationType === 'delete') {
          broadcastProductsUpdate();
        } else if (productId) {
          broadcastProductsUpdate(productId);
        } else {
          broadcastProductsUpdate();
        }

        broadcastCategoriesUpdate();
      });

      changeStreamInstance.on("error", (error) => {
        console.error("❌ Change Stream error:", error);
        if (changeStreamInstance) {
          changeStreamInstance.close();
          changeStreamInstance = null;
        }
        scheduleRetry();
      });

      changeStreamInstance.on("close", () => {
        console.warn("⚠️ Change Stream closed, will retry...");
        changeStreamInstance = null;
        scheduleRetry();
      });

      console.log("🟢 Change Stream initialized.");
    } catch (error) {
      console.error("❌ Error setting up Change Stream:", error);
      scheduleRetry();
    }
  };

  return {
    heartbeatInterval,
    setupChangeStream,
    broadcastProductsUpdate,
    broadcastCategoriesUpdate,
  };
}

// ============ GRACEFUL SHUTDOWN ============
function setupGracefulShutdown(server, wss, heartbeatInterval) {
  const shutdown = async (signal) => {
    console.log(`\n⚠️ ${signal} received, closing gracefully...`);
    
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (changeStreamInstance) changeStreamInstance.close();
    
    wss.close(() => console.log('✅ WebSocket server closed'));
    server.close(() => console.log('✅ HTTP server closed'));
    
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  server.on('close', () => shutdown('SERVER_CLOSE'));
}

// ============ EXPORTS ============
module.exports = {
  setupMiddleware,
  setupRoutes,
  connectDB,
  setupWebSocket,
  setupGracefulShutdown,
  CORS_ORIGINS,
  MONGO_OPTIONS,
};


