// 새 버전 감지 시 자동 캐시 갱신 및 네트워크 우선 서빙 Service Worker

const CACHE_NAME = 'jgsas-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // CDN 외부 요청은 SW에서 처리하지 않음
  if (url.origin !== self.location.origin) return;

  // 네트워크 우선: 항상 최신 파일 제공, 오프라인 시 캐시 fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
