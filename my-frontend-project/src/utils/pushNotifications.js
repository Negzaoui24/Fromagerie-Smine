function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush(apiUrl, token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications non supportées par ce navigateur.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.register("/sw.js");

  const publicKeyResponse = await fetch(`${apiUrl}/push/vapid-public-key`);
  if (!publicKeyResponse.ok) {
    throw new Error("Impossible de récupérer la clé publique VAPID.");
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

  await fetch(`${apiUrl}/push/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(subscription)
  });
}