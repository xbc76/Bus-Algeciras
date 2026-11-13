// Service worker de Bus Algeciras: permite instalar la app y abrirla sin conexión.
const C = "bus-algeciras-v1";
const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js",
  "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(C);
    await Promise.all(["./", "manifest.webmanifest", "icon-192.png", "icon-512.png"]
      .map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Red primero (así siempre ves la última versión) y, sin conexión, lo guardado.
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const propio = u.origin === location.origin && !u.search && !u.pathname.endsWith("data.json");
  if (!propio && !CDN.includes(r.url)) return;
  e.respondWith((async () => {
    try {
      const n = await fetch(r);
      if (n && (n.ok || n.type === "opaque")) (await caches.open(C)).put(r, n.clone());
      return n;
    } catch (err) {
      const c = await caches.match(r);
      return c || (r.mode === "navigate" ? await caches.match("./") : Response.error());
    }
  })());
});
