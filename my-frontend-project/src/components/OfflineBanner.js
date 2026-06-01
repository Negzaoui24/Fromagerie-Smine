import { useEffect, useState } from "react";

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    checkOnline();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-banner">
      <p>Vous êtes hors ligne — Fromagerie Smine affiche les dernières données disponibles</p>
    </div>
  );
};

export default OfflineBanner;
