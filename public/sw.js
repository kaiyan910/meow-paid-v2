/* Replaces the old Vite app shell cache on browsers that already installed MeowPaid. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("workbox-precache-") &&
                key.endsWith(self.registration.scope),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* A failed navigation gets a static offline notice. Account pages and API data stay on the network. */
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>MeowPaid</title><h1>MeowPaid</h1><p>You’re offline. Reconnect and reload to access your expenses.</p></html>',
          {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        ),
    ),
  );
});
