const CACHE_NAME = "fromagerie-smine-cache-v1";
const API_CACHE = "fromagerie-smine-api-cache-v1";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo192.png",
  "/logo512.png",
  "/favicon.ico"
];

const isApiRequest = (url) => {
  return ["/produits", "/categories", "/users/home", "/users/commercials", "/orders/client", "/orders", "/stripe"].some((path) => url.pathname.startsWith(path));
};

const isStaticAsset = (url) => {
  return url.origin === self.location.origin && (url.pathname.startsWith("/static/") || /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|json)$/i.test(url.pathname));
};

const cacheFirst = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
};

const networkFirst = async (request, cacheName = CACHE_NAME) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
      return response;
    }
    throw new Error("Fetch failed");
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(cacheFirst(request));
    return;
  }
});

const notifyClientsToSync = async () => {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  return Promise.all(
    clients.map((client) =>
      client.postMessage({
        type: "sync-offline-actions",
      })
    )
  );
};

self.addEventListener("sync", (event) => {
  if (event.tag === "fromagerie-smine-sync") {
    event.waitUntil(notifyClientsToSync());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
