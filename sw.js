/* KUJI BOX legacy roulette cleanup worker.
   If an older worker at /roulette/sw.js checks for an update,
   this version takes over, removes /roulette/ cache entries,
   then unregisters itself. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const OLD_PATH = "/roulette/";

    try {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          try {
            const url = new URL(request.url);

            if (
              url.origin === self.location.origin &&
              url.pathname.startsWith(OLD_PATH)
            ) {
              await cache.delete(request);
            }
          } catch {}
        }

        const remaining = await cache.keys();

        if (remaining.length === 0) {
          await caches.delete(cacheName);
        }
      }
    } catch {}

    try {
      await self.registration.unregister();
    } catch {}

    try {
      const clients =
        await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true
        });

      for (const client of clients) {
        if (client.url.includes("/roulette/")) {
          client.navigate(client.url);
        }
      }
    } catch {}
  })());
});

self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .catch(() => new Response(
        "This page is no longer available.",
        {
          status: 410,
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        }
      ))
  );
});
