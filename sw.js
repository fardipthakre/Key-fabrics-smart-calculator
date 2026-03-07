const CACHE_NAME = 'key-fabrics-v2'; // वर्शन बदलें ताकि पुराना कैश हट जाए

const PRECACHE_URLS = [
  '/Key-fabrics-smart-calculator/',           // मुख्य पृष्ठ
  '/Key-fabrics-smart-calculator/index.html',
  '/Key-fabrics-smart-calculator/advanced-tools.html', // अगर बनाया है
  '/Key-fabrics-smart-calculator/manifest.json',
  '/Key-fabrics-smart-calculator/icon-192.png',
  '/Key-fabrics-smart-calculator/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.12.0/math.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // अगर कैश में मिल गया, तो पहले वह दें, फिर बैकग्राउंड में नेटवर्क से अपडेट करें
      if (cached) {
        // नेटवर्क से फिर से फेच करके कैश अपडेट करें (अगर सफल हो)
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        return cached;
      }

      // कैश में नहीं है तो नेटवर्क से लाएँ और कैश करें
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // अगर नेटवर्क भी फेल हो और कोई HTML पेज चाहिए तो होम पेज दें
        if (event.request.destination === 'document') {
          return caches.match('/Key-fabrics-smart-calculator/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
