/* =========================================================
   Chill - Service Worker
   - Precaches the quiet piano radio and trio app shell.
   - Keeps cache cleanup scoped to chill cache names only.
   - Network-first for HTML so deploys propagate quickly.
   - Cache-first runtime fill for Tone.js once the user loads online.
========================================================= */

const CACHE_PREFIX = "chill-pwa";
const VERSION = `${CACHE_PREFIX}-v1`;
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const SCOPE_URL = new URL(self.registration.scope);

const PRECACHE_URLS = [
  "./",
  "index.html",
  "session.html",
  "style.css?v=pwa-1",
  "engine.js?v=pwa-1",
  "session.js?v=pwa-1",
  "manifest.webmanifest",
  "exports/chill-piano-recipe.json",
  "docs/listening-score-review.md",
  "icons/icon-96.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((error) => {
              console.warn("[Chill SW] precache miss:", url, error);
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isLocalAppUrl(url) {
  return url.origin === self.location.origin && url.pathname.startsWith(SCOPE_URL.pathname);
}

function isHtmlRequest(request) {
  return request.mode === "navigate" ||
    (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

function isToneCdn(url) {
  return url.hostname === "unpkg.com" && url.pathname.includes("/tone");
}

function matchCachedRequest(request, options = {}) {
  return caches.match(request).then((cached) => {
    if (cached || !options.ignoreSearch) return cached;
    return caches.match(request, { ignoreSearch: true });
  });
}

function fallbackHtml(url) {
  if (url.pathname.endsWith("/session.html")) return "session.html";
  return "index.html";
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.get("range")) return;

  const url = new URL(request.url);

  if (isToneCdn(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  if (!isLocalAppUrl(url)) return;

  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => matchCachedRequest(request, { ignoreSearch: true }).then((cached) => cached || caches.match(fallbackHtml(url))))
    );
    return;
  }

  event.respondWith(
    matchCachedRequest(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
