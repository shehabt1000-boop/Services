const CACHE_NAME = 'dalil-sharkia-v2.1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE =[
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  // يمكنك إضافة مسارات ملفات CSS أو الصور الثابتة هنا
];

// تثبيت الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل وتحديث الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات (Fetch)
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات فايربيز (لأن فايربيز يدير الأوفلاين الخاص به)
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // للطلبات الخاصة بالصفحات (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // لباقي الملفات (صور، سكريبتات) جرب الشبكة أولاً ثم الكاش
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});