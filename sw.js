const CACHE_NAME = "kalcupack-v3";
const urlsToCache = [
  "/KalcuPacK-Pro-app/",
  "/KalcuPacK-Pro-app/index.html",
  "/KalcuPacK-Pro-app/style.css",
  "/KalcuPacK-Pro-app/app.js",
  "/KalcuPacK-Pro-app/manifest.json",
  "/KalcuPacK-Pro-app/icon-192.png",
  "/KalcuPacK-Pro-app/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});