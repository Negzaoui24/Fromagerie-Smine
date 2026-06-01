import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [promptEvent, setPromptEvent] = useState(null);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    const checkOnline = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        const response = await fetch("/favicon.ico", {
          method: "HEAD",
          cache: "no-store"
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    const handleOnline = async () => {
      await checkOnline();
    };
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    checkOnline();

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

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner">
      <p>Vous êtes hors ligne — Fromagerie Smine affiche les dernières données disponibles</p>
      {promptEvent ? (
        <button type="button" className="install-button" onClick={handleInstall}>
          Ajouter à l'écran d'accueil
        </button>
      ) : (
        <p className="install-fallback">
          Pour ajouter cette application à l'écran d'accueil, utilisez le menu de votre navigateur et choisissez "Ajouter à l'écran d'accueil".
        </p>
      )}
      {installMessage && <p className="install-message">{installMessage}</p>}
    </div>
  );
};

export default OfflineBanner;
