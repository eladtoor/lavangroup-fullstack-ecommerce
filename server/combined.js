/**
 * combined.js - Production server (runs API + Next.js on single port)
 * Uses shared logic from core.js
 * 
 * Why: Render charges per service. Running both on one port saves money.
 */

const path = require("path");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const next = require("next");

const {
  setupMiddleware,
  setupRoutes,
  connectDB,
  setupWebSocket,
  setupGracefulShutdown,
} = require("./core");

const WEB_DIR = path.join(__dirname, "..", "web");

async function start() {
  // Create Express app and HTTP server
  const app = express();
  const server = http.createServer(app);

  // Create WebSocket server
  const wss = new WebSocket.Server({
    server,
    verifyClient: (info, callback) => {
      // Allow all connections for now
      // TODO: Add token verification for production
      callback(true);
    }
  });

  // Setup middleware (CORS, body parser, security headers)
  setupMiddleware(app);

  // Setup API routes
  setupRoutes(app);

  // Setup WebSocket handlers
  const { heartbeatInterval, setupChangeStream } = setupWebSocket(wss);

  // Connect to MongoDB and start Change Stream
  connectDB(setupChangeStream);

  // Setup graceful shutdown
  setupGracefulShutdown(server, wss, heartbeatInterval);

  // ---- Next.js ----
  const nextApp = next({ dev: false, dir: WEB_DIR });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // Everything else -> Next.js
  app.use((req, res) => handle(req, res));

  // Start server
  const port = Number(process.env.PORT || 10000);
  server.listen(port, () => {
    console.log(`✅ Production server listening on ${port}`);
  });
}

start().catch((e) => {
  console.error("❌ Failed to start combined server:", e);
  process.exit(1);
});
