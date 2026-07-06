import { useState, useEffect } from "react";

/**
 * Hook pour gérer le média hero du client
 * Charge automatiquement videoHero.mp4 par défaut
 */
export const useClientHeroMedia = () => {
  const [clientHeroMedia, setClientHeroMedia] = useState(() => {
    const savedMedia = localStorage.getItem("clientHeroMedia");
    if (savedMedia) {
      try {
        return JSON.parse(savedMedia);
      } catch (err) {
        console.warn("Impossible de parser clientHeroMedia:", err);
        return null;
      }
    }

    // Fallback: vérifier l'ancien format
    const legacyVideo = localStorage.getItem("clientHeroVideo");
    return legacyVideo ? { kind: "video", src: legacyVideo, name: "video" } : null;
  });

  useEffect(() => {
    // Si pas de vidéo, charger la vidéo par défaut
    if (!clientHeroMedia) {
      const defaultHero = {
        kind: "video",
        src: "/videoHero.mp4",
        name: "videoHero"
      };
      setClientHeroMedia(defaultHero);
      try {
        localStorage.setItem("clientHeroMedia", JSON.stringify(defaultHero));
      } catch (err) {
        console.warn("Impossible de sauvegarder clientHeroMedia:", err);
      }
    }
  }, [clientHeroMedia]);

  // Fonction pour mettre à jour le média
  const updateClientHeroMedia = (newMedia) => {
    setClientHeroMedia(newMedia);
    try {
      localStorage.setItem("clientHeroMedia", JSON.stringify(newMedia));
    } catch (err) {
      console.warn("Impossible de sauvegarder clientHeroMedia:", err);
    }
  };

  return { clientHeroMedia, setClientHeroMedia: updateClientHeroMedia };
};

export default useClientHeroMedia;
