const axios = require("axios");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramMessage(chatId, text) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { chat_id: chatId, text, parse_mode: "HTML" },
      { timeout: 5000 }
    );
  } catch (err) {
    console.error(
      `Erreur envoi notification Telegram (chat_id: ${chatId}):`,
      err.response?.data || err.message
    );
  }
}

async function notifyNewOrderTelegram(order) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN manquant dans .env — notification Telegram ignorée.");
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

  // On construit la liste des destinataires : l'admin + le commercial sélectionné
  const recipientChatIds = new Set();

  if (ADMIN_CHAT_ID) {
    recipientChatIds.add(ADMIN_CHAT_ID);
  }

  if (order.commercial?.telegramChatId) {
    recipientChatIds.add(order.commercial.telegramChatId);
  } else if (order.commercial) {
    console.warn(
      `Le commercial "${commercialName}" n'a pas de telegramChatId configuré — il ne recevra pas la notification.`
    );
  }

  if (recipientChatIds.size === 0) {
    console.warn("Aucun chat_id Telegram disponible (ni admin, ni commercial) — notification ignorée.");
    return;
  }

  await Promise.all(
    [...recipientChatIds].map((chatId) => sendTelegramMessage(chatId, text))
  );
}

module.exports = notifyNewOrderTelegram;