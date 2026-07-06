const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const mongoose = require("mongoose");
const config = require("config");
const User = require("./models/User");
const Order = require("./models/Order");
const Notification = require("./models/Notification");

const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI || (config.has && config.has("mongo_url") ? config.get("mongo_url") : "mongodb://localhost:27017/fromagerie_db");

mongoose.set("strictQuery", true);

async function testOrderNotifications() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Connecté à MongoDB");

    // Récupérer un commercial existant
    const commercial = await User.findOne({ role: "commercial" });
    if (!commercial) {
      console.error("❌ Aucun commercial trouvé. Veuillez créer un commercial d'abord.");
      process.exit(1);
    }
    console.log(`✅ Commercial trouvé: ${commercial.username} (${commercial.email})`);

    // Récupérer un admin existant
    const admin = await User.findOne({ role: { $in: ["admin", "super_admin"] } });
    if (!admin) {
      console.error("❌ Aucun admin trouvé. Veuillez créer un admin d'abord.");
      process.exit(1);
    }
    console.log(`✅ Admin trouvé: ${admin.username} (${admin.email})`);

    // Créer une commande de test
    const testOrder = new Order({
      customerName: "Test Client",
      customerEmail: "test@example.com",
      customerPhone: "+33612345678",
      customerLocation: "Paris",
      commercial: commercial._id,
      createdBy: admin._id,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          name: "Produit Test",
          quantity: 5,
          price: 25.50,
          unit: "kg"
        }
      ],
      status: "pending",
      comment: "Commande de test pour vérifier les notifications"
    });

    const savedOrder = await testOrder.save();
    console.log(`✅ Commande créée: ${savedOrder._id}`);

    // Vérifier les notifications créées
    const notifications = await Notification.find({ "data.orderId": savedOrder._id });
    console.log(`\n📢 Notifications créées: ${notifications.length}`);
    
    notifications.forEach((notif, index) => {
      const recipient = notif.recipient;
      console.log(`\n  Notification ${index + 1}:`);
      console.log(`  - Destinataire: ${recipient}`);
      console.log(`  - Titre: ${notif.title}`);
      console.log(`  - Message: ${notif.message}`);
      console.log(`  - Statut lu: ${notif.read ? "Oui" : "Non"}`);
    });

    // Vérifier les infos de contact
    console.log(`\n📱 Infos de contact pour WhatsApp:`);
    console.log(`  Commercial: ${commercial.phone || "❌ Pas de téléphone"}`);
    console.log(`  Admin: ${admin.phone || "❌ Pas de téléphone"}`);

    // Vérifier les variables Twilio
    console.log(`\n🔑 Configuration Twilio:`);
    console.log(`  TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Configuré" : "❌ Manquant"}`);
    console.log(`  TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? "✅ Configuré" : "❌ Manquant"}`);
    console.log(`  TWILIO_WHATSAPP_FROM: ${process.env.TWILIO_WHATSAPP_FROM || "❌ Manquant"}`);

    console.log("\n✅ Test terminé avec succès!");

    // Nettoyer - supprimer la commande de test
    await Order.deleteOne({ _id: savedOrder._id });
    await Notification.deleteMany({ "data.orderId": savedOrder._id });
    console.log("🧹 Commande de test supprimée");

  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testOrderNotifications();
