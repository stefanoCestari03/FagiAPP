import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Iniettato da vite-plugin-pwa — precache di tutti gli asset statici
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Attiva subito senza attendere la chiusura delle tab aperte
self.skipWaiting()
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// Font Google — Cache First (non cambiano mai)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

// Supabase API — Network First (dati aggiornati, fallback cache)
registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 5 }),
    ],
  })
)

// Navigazione — serve sempre index.html (SPA)
registerRoute(
  new NavigationRoute(
    new StaleWhileRevalidate({ cacheName: 'pages' })
  )
)
