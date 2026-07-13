const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const { saveSubscription, vapidPublicKey } = require("../../utils/push");

router.get("/vapid-public-key", (req, res) => {
  if (!vapidPublicKey) {
    return res.status(500).json({ status: "error", msg: "Clé publique VAPID non configurée." });
  }
  res.status(200).json({ status: "ok", data: { publicKey: vapidPublicKey } });
});

router.post("/subscribe", authMiddleware, async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ status: "notok", msg: "Abonnement invalide." });
    }
    await saveSubscription(subscription);
    return res.status(200).json({ status: "ok", msg: "Abonnement push enregistré." });
  } catch (error) {
    console.error("[push] Erreur /subscribe:", error);
    return res.status(500).json({ status: "error", msg: "Impossible d'enregistrer l'abonnement push." });
  }
});

module.exports = router;
