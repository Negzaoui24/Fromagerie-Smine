const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const mongoose = require("mongoose");
const config = require("config");
const User = require("./models/User");

const TARGET_EMAIL = "oussama.negzaoui24@gmail.com";
const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || (config.has && config.has("mongo_url") ? config.get("mongo_url") : "mongodb://localhost:27017/fromagerie_db");

mongoose.set("strictQuery", true);

async function run() {
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB", mongoUrl);

  const user = await User.findOne({ email: TARGET_EMAIL });
  if (!user) {
    console.error(`Utilisateur non trouvé pour l'email: ${TARGET_EMAIL}`);
    process.exit(1);
    return;
  }

  const previousStatus = user.accountStatus;
  const previousRole = user.role;

  user.accountStatus = "approved";
  user.role = "admin";
  await user.save();

  console.log(`Utilisateur mis à jour:`);
  console.log(`- email: ${user.email}`);
  console.log(`- ancien role: ${previousRole} -> nouveau role: ${user.role}`);
  console.log(`- ancien statut: ${previousStatus} -> nouveau statut: ${user.accountStatus}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((error) => {
  console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
  process.exit(1);
});
