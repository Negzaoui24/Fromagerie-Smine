const OFFLINE_ACTIONS_KEY = "fromagerieSmineOfflineActions";
const OFFLINE_CACHE_PREFIX = "fromagerieSmineCache";
const CART_STORAGE_KEY = "fromagerieSmineCartItems";

const safeJSONParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getOfflineActions = () => {
  const raw = localStorage.getItem(OFFLINE_ACTIONS_KEY);
  return Array.isArray(safeJSONParse(raw)) ? safeJSONParse(raw) : [];
};

const setOfflineActions = (actions) => {
  localStorage.setItem(OFFLINE_ACTIONS_KEY, JSON.stringify(actions || []));
};

export const enqueueOfflineAction = async (action) => {
  const current = getOfflineActions();
  const next = [...current, { ...action, queuedAt: new Date().toISOString() }];
  setOfflineActions(next);

  if (navigator.serviceWorker && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("fromagerie-smine-sync");
    } catch (error) {
      console.warn("Background sync unavailable:", error);
    }
  }

  return next;
};

export const flushOfflineActions = async () => {
  if (!navigator.onLine) {
    return false;
  }

  const actions = getOfflineActions();
  if (!actions.length) {
    return true;
  }

  const remaining = [];

  for (const action of actions) {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(action.url, {
        method: action.method || "POST",
        headers,
        body: JSON.stringify(action.payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Statut ${response.status}`);
      }
    } catch (error) {
      console.warn("Impossible de synchroniser l'action hors ligne:", error);
      remaining.push(action);
    }
  }

  setOfflineActions(remaining);
  return remaining.length === 0;
};

export const registerOfflineSyncListener = (onComplete) => {
  if (typeof window === "undefined") {
    return;
  }

  const tryFlush = async () => {
    const result = await flushOfflineActions();
    if (typeof onComplete === "function") {
      onComplete(result);
    }
  };

  window.addEventListener("online", tryFlush);

  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "sync-offline-actions") {
        tryFlush();
      }
    });
  }

  return () => {
    window.removeEventListener("online", tryFlush);
  };
};

export const saveCartItems = (cartItems) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    console.warn("Impossible de sauvegarder le panier hors ligne:", error);
  }
};

export const loadCartItems = () => {
  const raw = localStorage.getItem(CART_STORAGE_KEY);
  return Array.isArray(safeJSONParse(raw)) ? safeJSONParse(raw) : [];
};

export const cacheApiData = (key, data) => {
  try {
    localStorage.setItem(`${OFFLINE_CACHE_PREFIX}:${key}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Impossible de mettre en cache les donnees API:", error);
  }
};

export const loadApiCache = (key) => {
  const raw = localStorage.getItem(`${OFFLINE_CACHE_PREFIX}:${key}`);
  return safeJSONParse(raw) || null;
};
