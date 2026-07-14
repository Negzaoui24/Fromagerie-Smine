function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush(apiUrl, token) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push non supporté par ce navigateur."); // DEBUG - à retirer après
      console.warn("Push notifications non supportées par ce navigateur.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Permission refusée: " + permission); // DEBUG - à retirer après
      return;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    const publicKeyResponse = await fetch(`${apiUrl}/push/vapid-public-key`);
    if (!publicKeyResponse.ok) {
      throw new Error("Impossible de récupérer la clé publique VAPID. Status: " + publicKeyResponse.status);
    }
    const { data } = await publicKeyResponse.json();
    const publicKey = data?.publicKey;
    if (!publicKey) {
      throw new Error("Clé publique VAPID introuvable.");
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const subscribeResponse = await fetch(`${apiUrl}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(subscription)
    });

    if (!subscribeResponse.ok) {
      throw new Error("Erreur serveur lors de l'enregistrement: " + subscribeResponse.status);
    }

    alert("Succès ! Abonnement enregistré."); // DEBUG - à retirer après
  } catch (error) {
    alert("ERREUR PUSH: " + error.message); // DEBUG - à retirer après
    console.error("Erreur dans subscribeToPush:", error);
    throw error;
  }
}