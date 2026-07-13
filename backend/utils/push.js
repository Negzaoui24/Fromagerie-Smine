const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL;

if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
  console.warn("[push] VAPID variables manquantes. Configurez VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY et VAPID_EMAIL.");
}

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey);
}

const subscriptionFile = path.resolve(__dirname, "..", "push-subscription.json");

const saveSubscription = async (subscription) => {
  try {
    fs.writeFileSync(subscriptionFile, JSON.stringify(subscription, null, 2), "utf-8");
    console.log("[push] Abonnement admin enregistré dans push-subscription.json");
  } catch (error) {
    console.error("[push] Impossible d'enregistrer l'abonnement admin:", error);
    throw error;
  }
};

const loadSubscription = () => {
  try {
    if (!fs.existsSync(subscriptionFile)) {
      return null;
    }
    const raw = fs.readFileSync(subscriptionFile, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[push] Impossible de lire l'abonnement admin:", error);
    return null;
  }
};

const notifyAdminPush = async (order) => {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    console.warn("[push] VAPID non configuré, notification push non envoyée.");
    return;
  }

  const subscription = loadSubscription();
  if (!subscription) {
    console.warn("[push] Aucun abonnement admin disponible pour envoyer la notification.");
    return;
  }

  const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const payload = JSON.stringify({
    title: "Nouvelle commande",
    body: `Client: ${order.customerName}, Total: ${total} FCFA`,
    icon: "/logo192.png",
    data: {
      url: `/admin/dashboard?panel=orders&orderId=${order._id}`
    }
  });

  webpush.sendNotification(subscription, payload)
    .then(() => {
      console.log(`[push] Notification envoyée à l'admin pour la commande ${order._id}`);
    })
    .catch((err) => {
      console.error("[push] Erreur envoi notification admin:", err);
    });
};

module.exports = {
  saveSubscription,
  notifyAdminPush,
  vapidPublicKey
};
