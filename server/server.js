require("dotenv").config();

console.log("📧 GMAIL_USER:", process.env.GMAIL_USER);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const WebSocket = require("ws"); // Import WebSocket
const { buildCategoryStructure } = require("./controllers/categoryController");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const materialGroupRoutes = require("./routes/materialGroupRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const emailRoutes = require("./routes/emailRoutes");
const categoryImagesRoutes = require("./routes/categoryImagesRoutes");
const siteStatsRoutes = require("./routes/siteStatsRoutes");
const imageProxyRoutes = require("./routes/imageProxyRoutes");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info, callback) => {
    // Allow all connections for now
    // TODO: Add token verification for production
    callback(true);
  }
});

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

// Connect to MongoDB with retry mechanism
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    });
    console.log("✅ MongoDB connected");

    setupChangeStream(); // Start Change Stream
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    setTimeout(connectDB, 5000); // Retry connection in 5 seconds
  }
};

connectDB(); // Initial connection

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://lavangroup.co.il",
    "https://www.lavangroup.co.il",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ HTTP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "img-src 'self' https: data:; " +
      "script-src 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com https://cdn.enable.co.il; " +
      "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com https://cdn.enable.co.il; " +
      "style-src 'self' 'unsafe-inline' https://vee-crm.com https://www.gstatic.com https://cdn.enable.co.il; " +
      "font-src 'self' https: data:; " +
      "connect-src 'self' https://vee-crm.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://hybrid-app-1-2haj.onrender.com https://lavangroup.co.il https://firestore.googleapis.com wss://hybrid-app-1-2haj.onrender.com https://identitytoolkit.googleapis.com https://www.lavangroup.co.il https://securetoken.googleapis.com https://api.cloudinary.com https://cdn.enable.co.il; " +
      "frame-src 'self' https://*.firebaseapp.com; " +
      "worker-src 'none'; " +
      "media-src 'none'; " +
      "frame-ancestors 'none'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
  );

  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
  next();
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api", categoryRoutes);
app.use("/api/materialGroups", materialGroupRoutes);

app.use("/api/payment", paymentRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/category-images", categoryImagesRoutes);
app.use("/api/images", imageProxyRoutes);

app.use("/api/site-stats", siteStatsRoutes);

app.use((req, res, next) => {
  const blockedFiles = ["/BitKeeper", "/.hg", "/.bzr", "/.darcs"];
  if (blockedFiles.includes(req.path)) {
    return res.status(404).send("Not found");
  }
  next();
});

// app.use(
//   express.static(path.join(__dirname, "../web/build"), {
//     dotfiles: "ignore",
//   })
// );
// app.get("*", (req, res, next) => {
//   if (req.path.includes("api")) {
//     return next();
//   }
//   res.send("API Server Running");
// });

app.get("/", (req, res) => {
  res.send("🟢 Server is running");
});

/** ==========================
 *  🔹 WEBSOCKET LOGIC BELOW
 *  ========================== */

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
}, 30000); // Check every 30 seconds

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { 
    ws.isAlive = true; 
  });
  console.log('🟢 New WebSocket client connected');
});

// Broadcast product updates to all clients
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
        // Fallback to full broadcast if product not found
        payload = await mongoose.model("Product").find({}).lean().limit(1000);
      }
    } else {
      // Full sync - limit to 1000 products for 512MB RAM
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
    // Simulate a request and response object for buildCategoryStructure
    const req = {}; // Empty request
    const res = {
      status: (statusCode) => ({
        json: (data) => {
          if (statusCode !== 200) {
            console.warn("⚠️ Failed to build category structure:", data);
            return;
          }

          const formattedCategories = data;
          if (!formattedCategories.length) {
            console.warn(
              "⚠️ No categories generated from products, skipping broadcast."
            );
            return;
          }

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "CATEGORIES_UPDATED",
                  payload: formattedCategories,
                })
              );
            }
          });
        },
      }),
    };

    await buildCategoryStructure(req, res); // Call the function directly
  } catch (error) {
    console.error("❌ Error broadcasting category updates:", error);
  }
};

// Setup MongoDB Change Stream
let changeStreamInstance = null;

const setupChangeStream = () => {
  try {
    // Close existing stream if any
    if (changeStreamInstance) {
      changeStreamInstance.close();
    }

    const productCollection = mongoose.connection.collection("products");
    changeStreamInstance = productCollection.watch([], {
      fullDocument: 'updateLookup',
      maxAwaitTimeMS: 30000, // Prevent hanging
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

    console.log("🟢 Change Stream initialized.");
  } catch (error) {
    console.error("❌ Error setting up Change Stream:", error);
  }
};

// WebSocket Handling
wss.on("connection", (ws) => {
  console.log("🟢 New WebSocket client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString()); // Convert Buffer to String & Parse JSON

      // console.log("📩 Parsed WebSocket Message:", parsedMessage);

      if (parsedMessage.type === "REQUEST_PRODUCTS_UPDATE") {
        broadcastProductsUpdate(); // Full broadcast
      }
      
      // Handle single product update request (optimized)
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

  ws.on("close", () => {
    console.log("🔴 WebSocket client disconnected");
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful shutdown
server.on('close', () => {
  console.log('🔴 Server closing...');
  clearInterval(heartbeatInterval);
  if (changeStreamInstance) {
    changeStreamInstance.close();
  }
  wss.clients.forEach((client) => {
    client.close();
  });
  mongoose.connection.close(false, () => {
    console.log('🔴 MongoDB connection closed');
  });
});
