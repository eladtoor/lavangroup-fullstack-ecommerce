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
const wss = new WebSocket.Server({ server });

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

// Connect to MongoDB with retry mechanism
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
app.use(express.json());

// ✅ HTTP Security Headers Middleware
app.use((req, res, next) => {
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

// Broadcast product updates to all clients
const broadcastProductsUpdate = async () => {
  try {
    // ✅ שליפה ישירה עם המודל כדי לוודא שאנחנו מקבלים נתונים מעודכנים באמת
    const updatedProducts = await mongoose.model("Product").find({}).lean();

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // 🔍 בדיקה אם יש מוצרים לא תקינים

        const specificProducts = updatedProducts.filter((p) =>
          ["5352", "1234"].includes(p.מזהה.toString())
        );

        console.log(
          "🔄 WebSocket - Server sending specific products:",
          specificProducts
        );

        client.send(
          JSON.stringify({ type: "PRODUCTS_UPDATED", payload: updatedProducts })
        );
      }
    });
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
const setupChangeStream = () => {
  try {
    const productCollection = mongoose.connection.collection("products");
    const changeStream = productCollection.watch();

    changeStream.on("change", async (change) => {
      broadcastProductsUpdate(); // Broadcast updated product list
      broadcastCategoriesUpdate(); // ✅ Now also update categories list
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

// WebSocket Handling
wss.on("connection", (ws) => {
  console.log("🟢 New WebSocket client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString()); // Convert Buffer to String & Parse JSON

      // console.log("📩 Parsed WebSocket Message:", parsedMessage);

      if (parsedMessage.type === "REQUEST_PRODUCTS_UPDATE") {
        console.log("🔄 WebSocket: Sending Updated Products...");
        broadcastProductsUpdate(); // ✅ Ensure this function is broadcasting correctly
      }

      if (parsedMessage.type === "REQUEST_CATEGORIES_UPDATE") {
        console.log("🔄 WebSocket: Sending Updated Categories...");
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
