/* 听域 TY Music Service Worker */
const VERSION = 'v4';
const SHELL = `tym-shell-${VERSION}`;
const STATIC = `tym-static-${VERSION}`;
const IMAGES = `tym-img-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = ['/', '/charts', '/playlists', '/search', '/library', OFFLINE_URL, '/manifest.webmanifest', '/icon', '/pwa-icon/192', '/pwa-icon/512'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL)
      .then(c => Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [SHELL, STATIC, IMAGES];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 音频流和 API 一律走网络 (Range 请求不能缓存)
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;
  if (req.destination === 'audio' || req.headers.has('range')) return;

  // 页面导航: 网络优先, 离线时回退到缓存或离线页
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        const res = preload || await fetch(req);
        if (res.ok) {
          const c = await caches.open(SHELL);
          c.put(req, res.clone());
        }
        return res;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || (await caches.match(OFFLINE_URL)) || Response.error();
      }
    })());
    return;
  }

  // Next 静态资源: 带哈希, 缓存优先
  if (url.origin === location.origin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/pwa-icon/') || url.pathname === '/icon')) {
    event.respondWith(caches.open(STATIC).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // 封面图片: stale-while-revalidate
  if (req.destination === 'image') {
    event.respondWith(caches.open(IMAGES).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trim(IMAGES, 300); }
        return res;
      }).catch(() => hit);
      return hit || net;
    }));
  }
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
