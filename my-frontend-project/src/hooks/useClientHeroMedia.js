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
    // Si pas de vidéo, charger la vidéo par défaut depuis Cloudinary
    if (!clientHeroMedia) {
      const defaultHero = {
        kind: "video",
        src: "https://res.cloudinary.com/davdhrcwz/video/upload/v1783335288/SnapSave_App_4496105043840517_1080p_uyuv7x.mp4",
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
