// Service Worker para notificaciones en segundo plano
const CACHE_NAME = 'petcare-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/favicon.ico',
  '/badge-icon.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de peticiones de red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Notificaciones en segundo plano
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'Tienes un recordatorio de PetCare',
    icon: data.icon || '/favicon.ico',
    vibrate: data.vibrate || [100, 50, 100],
    badge: data.badge || '/badge-icon.png',
    tag: data.tag || 'default-tag',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'PetCare', options)
  );
});

// Al hacer clic en una notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(clientList => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventanas abiertas, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Escuchar eventos de sincronización para notificaciones programadas
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Función para sincronizar notificaciones (esto puede ser modificado según tus necesidades)
async function syncNotifications() {
  // Esta función se ejecutaría cuando el dispositivo recupere conexión
  // Podrías hacer alguna lógica adicional aquí si es necesario
  console.log('Sincronizando notificaciones...');
  
  // Aquí podrías hacer una petición al servidor si tuvieras uno
  // O simplemente verificar si hay eventos locales pendientes
  try {
    const cache = await caches.open('event-notifications');
    const pendingEvents = await cache.match('pending-events');
    
    if (pendingEvents) {
      const events = await pendingEvents.json();
      
      // Mostrar notificaciones pendientes
      events.forEach(event => {
        self.registration.showNotification(event.title, event.options);
      });
      
      // Limpiar eventos pendientes
      await cache.delete('pending-events');
    }
  } catch (error) {
    console.error('Error al sincronizar notificaciones:', error);
  }
}