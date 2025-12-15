/**
 * server.js - Development server (runs API only on port 5000)
 * Uses shared logic from core.js
 */

const http = require("http");
const express = require("express");
const WebSocket = require("ws");

const {
  setupMiddleware,
  setupRoutes,
  connectDB,
  setupWebSocket,
  setupGracefulShutdown,
} = require("./core");

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

// Root endpoint for dev server
app.get("/", (req, res) => {
  res.send("🟢 API Server is running (development mode)");
});

// Setup WebSocket handlers
const { heartbeatInterval, setupChangeStream } = setupWebSocket(wss);

// Connect to MongoDB and start Change Stream
connectDB(setupChangeStream);

// Setup graceful shutdown
setupGracefulShutdown(server, wss, heartbeatInterval);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Development server running on port ${PORT}`);
});
