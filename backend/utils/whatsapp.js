const normalizePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return null;
  }
  const normalized = phone.replace(/[^0-9+]/g, "");
  if (!normalized) {
    return null;
  }
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
};

const sendWhatsAppMessage = async ({ recipientPhone, body }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !whatsappFrom) {
    console.warn("Twilio WhatsApp non configuré : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_WHATSAPP_FROM manquant.");
    return;
  }

  const toPhone = normalizePhone(recipientPhone);
  if (!toPhone) {
    console.warn("Impossible d'envoyer le message WhatsApp : numéro invalide", recipientPhone);
    return;
  }

  try {
    const client = require("twilio")(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${toPhone}`,
      body
    });
  } catch (error) {
    console.error("Erreur envoi WhatsApp :", error.message || error);
  }
};

module.exports = {
  sendWhatsAppMessage
};
