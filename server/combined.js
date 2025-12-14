require("dotenv").config();

/**
 * Single Render service: serve BOTH
 * - Next.js app from ../web
 * - API routes under /api/*
 *
 * Why: React could be built into static files. Next.js needs a Node runtime.
 */

const path = require("path");
const http = require("http");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const WebSocket = require("ws");

const next = require("next");

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

const WEB_DIR = path.join(__dirname, "..", "web");

async function start() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  // ---- DB ----
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables.");
    process.exit(1);
  }

  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
      setupChangeStream();
    } catch (err) {
      console.error("❌ MongoDB connection error:", err);
      setTimeout(connectDB, 5000);
    }
  };
  connectDB();

  // ---- middleware ----
  const corsOptions = {
    origin: ["http://localhost:3000", "https://lavangroup.co.il", "https://www.lavangroup.co.il"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  // Security headers (copied from server.js)
  app.use((req, res, nextMiddleware) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "img-src 'self' https: data:; " +
        "script-src 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com; " +
        "script-src-elem 'self' 'unsafe-inline' https://apis.google.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://vee-crm.com; " +
        "style-src 'self' 'unsafe-inline' https://vee-crm.com https://www.gstatic.com; " +
        "font-src 'self' https: data:; " +
        "connect-src 'self' https://vee-crm.com https://cdn.gtranslate.net https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://clients6.google.com https://translate.googleusercontent.com https://hybrid-app-1-2haj.onrender.com https://lavangroup.co.il https://firestore.googleapis.com wss://hybrid-app-1-2haj.onrender.com https://identitytoolkit.googleapis.com https://www.lavangroup.co.il https://securetoken.googleapis.com https://api.cloudinary.com; " +
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
    nextMiddleware();
  });

  // ---- API routes ----
  app.use("/api/users", userRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api", categoryRoutes);
  app.use("/api/materialGroups", materialGroupRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/category-images", categoryImagesRoutes);
  app.use("/api/images", imageProxyRoutes);
  app.use("/api/site-stats", siteStatsRoutes);

  app.get("/health", (req, res) => res.status(200).send("ok"));

  // ---- Next.js ----
  const nextApp = next({ dev: false, dir: WEB_DIR });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  // Everything else -> Next
  app.all("*", (req, res) => handle(req, res));

  // ---- WebSocket (copied from server.js) ----
  const broadcastProductsUpdate = async () => {
    try {
      const updatedProducts = await mongoose.model("Product").find({}).lean();
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "PRODUCTS_UPDATED", payload: updatedProducts }));
        }
      });
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
            const formattedCategories = data;
            if (!formattedCategories.length) return;
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({ type: "CATEGORIES_UPDATED", payload: formattedCategories })
                );
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

  const setupChangeStream = () => {
    try {
      const productCollection = mongoose.connection.collection("products");
      const changeStream = productCollection.watch();

      changeStream.on("change", async () => {
        broadcastProductsUpdate();
        broadcastCategoriesUpdate();
      });

      changeStream.on("error", (error) => {
        console.error("❌ Change Stream error:", error);
        setTimeout(setupChangeStream, 5000);
      });

      console.log("🟢 Change Stream initialized.");
    } catch (error) {
      console.error("❌ Error setting up Change Stream:", error);
    }
  };

  // ---- listen ----
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => {
    console.log(`✅ Combined server listening on ${port}`);
  });
}

start().catch((e) => {
  console.error("❌ Failed to start combined server:", e);
  process.exit(1);
});


