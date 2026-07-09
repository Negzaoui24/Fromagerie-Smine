const router = require("express").Router();
const authMiddleware = require("../../middleware/authMiddleware");
const Notification = require("../../models/Notification");
const mongoose = require("mongoose");
const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

router.get("/", authMiddleware, async (req, res) => {
  try {
    log("[notifications] GET /");
    log("[notifications] req.user: " + JSON.stringify(req.user));
    log("[notifications] req.user.id: " + req.user.id + " Type: " + typeof req.user.id);
    
    // Convert req.user.id to ObjectId for proper matching
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(req.user.id);
      log("[notifications] Converted userId: " + userId);
    } catch (conversionErr) {
      log("[notifications] Failed to convert userId: " + req.user.id);
      return res.status(400).json({ status: "error", msg: "Invalid user ID format" });
    }
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 });

    log("[notifications] Found notifications: " + notifications.length);
    return res.status(200).json({ status: "ok", notifications });
  } catch (err) {
    log("Erreur récupération notifications: " + err.message);
    console.error("Erreur récupération notifications:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la lecture des notifications." });
  }
});

router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    // Convert IDs to ObjectId for proper matching
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const notificationId = new mongoose.Types.ObjectId(req.params.id);
    
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ status: "notok", msg: "Notification introuvable." });
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json({ status: "ok", notification });
  } catch (err) {
    console.error("Erreur mise à jour notification:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la mise à jour de la notification." });
  }
});

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    // Convert req.user.id to ObjectId for proper matching
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ status: "ok", msg: "Toutes les notifications ont été marquées comme lues." });
  } catch (err) {
    console.error("Erreur mise à jour notifications:", err);
    return res.status(500).json({ status: "error", msg: "Erreur lors de la mise à jour des notifications." });
  }
});

module.exports = router;
