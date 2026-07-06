const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const express = require("express");
const mongoose = require("mongoose");
const config = require("config");
const cors = require("cors");
const users = require("./routes/api/users");
const products = require("./routes/api/Products");
const categories = require("./routes/api/Categories");
const createPaymentIntent = require("./routes/api/create-payment-intent");
const commercialClients = require("./routes/api/commercialClients");
const orders = require("./routes/api/orders");
const notifications = require("./routes/api/notifications");
const app = express();
let isMongoConnected = false;

// Pour analyser le corps des requêtes HTTP (JSON)
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002"
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// Autoriser le partage de ressources (CORS) avec envoi de cookies
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// Route principale de vérification de l'API
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "API Express fonctionne correctement" });
});

// Route de diagnostic
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "Serveur en ligne",
    mongodb: isMongoConnected ? "✅ Connecté" : "❌ Non connecté",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

// Servir les fichiers statiques (images) uniquement en local (Vercel: FS éphémère)
if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
}

// Connexion à MongoDB
const mongo_url = process.env.MONGO_URL || process.env.MONGODB_URI || (config.has && config.has("mongo_url") ? config.get("mongo_url") : "mongodb://localhost:27017/fromagerie_db");
mongoose.set("strictQuery", true);

const connectToDatabase = async () => {
    if (isMongoConnected) {
        return;
    }

    try {
      await mongoose.connect(mongo_url, {
        retryWrites: true,
        w: "majority",
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      isMongoConnected = true;
      console.log("✅ MongoDB connected...");
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
      isMongoConnected = false;
      throw err;
    }
};

connectToDatabase().catch((err) => {
  console.error("Erreur connexion initiale MongoDB:", err.message);
  // Ne pas quitter, laisser les endpoints essayer de se reconnecter
});

// Port du serveur
app.use("/users", users);
app.use("/categories", categories);
app.use("/produits", products);
app.use("/commercial-clients", commercialClients);
app.use("/orders", orders);
app.use("/notifications", notifications);
app.use("/stripe", createPaymentIntent);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("🔥 UNCAUGHT ERROR:", err);
  console.error("Stack:", err.stack);
  res.status(err.status || 500).json({
    status: "error",
    msg: err.message || "Erreur serveur interne"
  });
});

const port = process.env.PORT || 3015;

// Démarrer le serveur
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () =>
        console.log(`Server running on port ${port}`)
    );
}

module.exports = app;
