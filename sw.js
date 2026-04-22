const CACHE_NAME = 'dalil-sharkia-v3.0';
const DYNAMIC_CACHE = 'dalil-sharkia-dynamic-v3.0';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE =[
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png'
];

// التثبيت
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// التفعيل ومسح الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // تجاهل طلبات فايربيز و API الخارجية
  if (
    requestUrl.hostname.includes('firestore.googleapis.com') || 
    requestUrl.hostname.includes('identitytoolkit.googleapis.com') ||
    requestUrl.hostname.includes('cloudinary.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // 1. طلبات تصفح الصفحات (HTML) -> Network First then Offline Page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 2. طلبات الملفات الثابتة (صور، خطوط، سكريبتات) -> Cache First then Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // إرجاع من الكاش فوراً (سرعة عالية)
      }
      
      // إذا لم يكن في الكاش، جربه من الإنترنت واحفظه
      return fetch(event.request).then((networkResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // يمكن إرجاع صورة افتراضية هنا إذا فشل تحميل صورة معينة
      });
    })
  );
});