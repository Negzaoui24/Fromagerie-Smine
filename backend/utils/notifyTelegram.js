const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function notifyNewOrderTelegram(order) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant dans .env — notification Telegram ignorée.");
    return;
  }

  const total = (order.items || []).reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const commercialName = order.commercial?.username || "N/A";

  const text =
    `🧀 <b>Nouvelle commande</b>\n` +
    `Client: ${order.customerName}\n` +
    `Téléphone: ${order.customerPhone}\n` +
    `Commercial: ${commercialName}\n` +
    `Articles: ${order.items?.length || 0}\n` +
    `Total: ${total.toFixed(2)} DT`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { chat_id: CHAT_ID, text, parse_mode: "HTML" },
      { timeout: 5000 }
    );
  } catch (err) {
    console.error("Erreur envoi notification Telegram:", err.response?.data || err.message);
  }
}

module.exports = notifyNewOrderTelegram;