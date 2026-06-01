import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [promptEvent, setPromptEvent] = useState(null);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;

    promptEvent.prompt();
    const choiceResult = await promptEvent.userChoice;

    if (choiceResult.outcome === "accepted") {
      setInstallMessage("Installation ajoutée à l'ecran d'accueil.");
    } else {
      setInstallMessage("L'installation a été annulée.");
    }

    setPromptEvent(null);
  };

  return (
    <div className="offline-banner">
      <p>Vous êtes hors ligne — Fromagerie Smine affiche les dernières données disponibles</p>
      {promptEvent && (
        <button type="button" className="install-button" onClick={handleInstall}>
          Ajouter à l'écran d'accueil
        </button>
      )}
      {installMessage && <p className="install-message">{installMessage}</p>}
    </div>
  );
};

export default OfflineBanner;
