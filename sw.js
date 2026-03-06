const CACHE_NAME = 'sharkia-images-v2';

// حدث التثبيت: تفعيل السيرفر ووركر مباشرة
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// حدث التنشيط: مسح أي كاش قديم لتوفير المساحة
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

// حدث الجلب (Fetch): اعتراض طلبات الصور وحفظها في الكاش
self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    
    // استهداف صور أقسام المهن، صور المستخدمين، وصور الحسابات الافتراضية
    if (url.includes('pexels.com') || url.includes('cloudinary.com') || url.includes('ui-avatars.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                // إذا كانت الصورة محفوظة مسبقاً، قم بإرجاعها فوراً (بدون استهلاك إنترنت)
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // إذا لم تكن محفوظة، قم بتحميلها من الإنترنت ثم احفظها للمرات القادمة
                return fetch(event.request).then((networkResponse) => {
                    // التحقق من صحة الاستجابة
                    if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque')) {
                        return networkResponse;
                    }
                    
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    
                    return networkResponse;
                }).catch(() => {
                    // في حالة انقطاع الإنترنت وعدم وجود الصورة في الكاش
                    return new Response('');
                });
            })
        );
    }
});