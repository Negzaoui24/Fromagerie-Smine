const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const mongoose = require("mongoose");
const config = require("config");
const User = require("./models/User");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || (config.has && config.has("mongo_url") ? config.get("mongo_url") : "mongodb://localhost:27017/fromagerie_db");

mongoose.set("strictQuery", true);

async function runDiagnostics() {
  console.log("🔍 DIAGNOSTIC SERVEUR\n");

  // 1. Vérifier les variables d'environnement
  console.log("📋 Variables d'environnement:");
  console.log("  NODE_ENV:", process.env.NODE_ENV || "development");
  console.log("  MONGO_URL:", mongoUrl ? "✅ Configurée" : "❌ Manquante");
  console.log("  JWT_SECRET:", process.env.JWT_SECRET ? "✅ Configurée" : "❌ Manquante");
  console.log("  CLIENT_URL:", process.env.CLIENT_URL || "❌ Manquante");

  // 2. Tester la connexion MongoDB
  console.log("\n📊 Connexion MongoDB:");
  try {
    await mongoose.connect(mongoUrl, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000
    });
    console.log("  ✅ Connecté à MongoDB");

    // 3. Compter les utilisateurs
    const userCount = await User.countDocuments();
    console.log(`  ✅ ${userCount} utilisateurs trouvés`);

    // 4. Lister les utilisateurs
    const users = await User.find().select("username email role phone accountStatus").limit(5);
    console.log("\n  Utilisateurs (premiers 5):");
    users.forEach((user, i) => {
      console.log(`    ${i + 1}. ${user.username} (${user.email}) - Role: ${user.role} - Status: ${user.accountStatus} - Phone: ${user.phone || "❌ Pas de téléphone"}`);
    });

    // 5. Vérifier un utilisateur spécifique
    const testUser = await User.findOne({ email: "oussama.negzaoui24@gmail.com" });
    if (testUser) {
      console.log("\n✅ Utilisateur admin trouvé:");
      console.log("  - Email:", testUser.email);
      console.log("  - Role:", testUser.role);
      console.log("  - Status:", testUser.accountStatus);
      console.log("  - Password hash:", testUser.password ? "✅ Présent" : "❌ Absent");
    } else {
      console.log("\n❌ Utilisateur admin NON trouvé");
    }

  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message);
  }

  // 6. Vérifier les dépendances
  console.log("\n📦 Dépendances:");
  const packages = ["bcryptjs", "jsonwebtoken", "mongoose", "express", "cors", "twilio"];
  packages.forEach(pkg => {
    try {
      require(pkg);
      console.log(`  ✅ ${pkg}`);
    } catch (e) {
      console.log(`  ❌ ${pkg} - NOT INSTALLED`);
    }
  });

  await mongoose.disconnect();
  console.log("\n✅ Diagnostic terminé");
  process.exit(0);
}

runDiagnostics().catch((err) => {
  console.error("❌ Erreur:", err.message);
  process.exit(1);
});
