/**
 * core.js - Shared logic between server.js (dev) and combined.js (production)
 * This eliminates code duplication and ensures both environments work the same.
 */

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const WebSocket = require("ws");
const { buildCategoryStructure } = require("./controllers/categoryController");

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
}

// ============ ROUTES SETUP ============
function setupRoutes(app) {
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api", categoryRoutes);
  app.use("/api/materialGroups", materialGroupRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/category-images", categoryImagesRoutes);
  app.use("/api/images", imageProxyRoutes);
  app.use("/api/site-stats", siteStatsRoutes);

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

// ============ DATABASE CONNECTION ============
let changeStreamInstance = null;
let onChangeStreamReady = null;

async function connectDB(onReady) {
  onChangeStreamReady = onReady;
  
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    console.log("✅ MongoDB connected");
    if (onChangeStreamReady) onChangeStreamReady();
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    setTimeout(() => connectDB(onReady), 5000);
  }
}

// ============ WEBSOCKET LOGIC ============
function setupWebSocket(wss) {
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
    }
  };

  const broadcastCategoriesUpdate = async () => {
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
      await buildCategoryStructure(req, res);
    } catch (error) {
      console.error("❌ Error broadcasting category updates:", error);
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
  const setupChangeStream = () => {
    try {
      if (changeStreamInstance) {
        changeStreamInstance.close();
      }

      const productCollection = mongoose.connection.collection("products");
      changeStreamInstance = productCollection.watch([], {
        fullDocument: 'updateLookup',
        maxAwaitTimeMS: 30000,
      });

      changeStreamInstance.on("change", async (change) => {
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
        setTimeout(setupChangeStream, 5000);
      });

      changeStreamInstance.on("close", () => {
        console.warn("⚠️ Change Stream closed, will retry...");
        changeStreamInstance = null;
        setTimeout(setupChangeStream, 5000);
      });

      console.log("🟢 Change Stream initialized.");
    } catch (error) {
      console.error("❌ Error setting up Change Stream:", error);
      setTimeout(setupChangeStream, 5000);
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


