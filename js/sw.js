// Service Worker pour Focus ISEP - Cache et fonctionnalités hors ligne
const CACHE_NAME = 'focus-isep-v1.2.0';
const STATIC_CACHE = 'focus-isep-static-v1.1.0';
const DYNAMIC_CACHE = 'focus-isep-dynamic-v1.0.0';

// URLs à mettre en cache lors de l'installation
const STATIC_URLS = [
    '/',
    '/index.html',
    '/style.css',
    '/js/config.js',
    '/js/security.js',
    '/js/theme-manager.js',
    '/js/auth-manager.js',
    '/js/progress-manager.js',
    '/js/badge-manager.js',
    '/js/legal-pages.js',
    '/js/app.js',
    '/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
    STATIC: 'cache-first',
    DYNAMIC: 'network-first',
    IMAGES: 'cache-first',
    API: 'network-first'
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installation...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Mise en cache des ressources statiques');
                return cache.addAll(STATIC_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker installé');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erreur installation Service Worker:', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker activation...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Supprimer les anciens caches
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activé');
                return self.clients.claim();
            })
    );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Ignorer les requêtes non-GET et les requêtes Supabase (gérées par network-first)
    if (event.request.method !== 'GET') {
        return;
    }

    // Stratégie pour les ressources statiques
    if (isStaticAsset(url)) {
        event.respondWith(handleStaticRequest(event.request));
    }
    // Stratégie pour les images
    else if (isImageRequest(url)) {
        event.respondWith(handleImageRequest(event.request));
    }
    // Stratégie pour les API Supabase
    else if (isApiRequest(url)) {
        event.respondWith(handleApiRequest(event.request));
    }
    // Stratégie par défaut
    else {
        event.respondWith(handleDefaultRequest(event.request));
    }
});

// Vérification des ressources statiques
function isStaticAsset(url) {
    return STATIC_URLS.some(staticUrl => 
        url.href === staticUrl || 
        url.href.startsWith(self.location.origin + '/js/') ||
        url.href.includes('/style.css')
    );
}

// Vérification des requêtes d'images
function isImageRequest(url) {
    return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url.pathname);
}

// Vérification des requêtes API
function isApiRequest(url) {
    return url.href.includes('supabase.co') || 
           url.href.includes('/api/');
}

// Gestion des requêtes statiques (Cache First)
async function handleStaticRequest(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Ressource statique depuis le cache:', request.url);
            return cachedResponse;
        }

        // Fallback réseau
        const networkResponse = await fetch(request);
        
        // Mettre en cache la nouvelle ressource
        if (networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Erreur cache statique:', error);
        
        // Fallback pour la page d'accueil
        if (request.url === self.location.origin + '/') {
            const cache = await caches.open(STATIC_CACHE);
            return cache.match('/index.html');
        }
        
        return new Response('Ressource non disponible', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Gestion des images (Cache First avec expiration)
async function handleImageRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        console.log('🖼️ Image depuis le cache:', request.url);
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Erreur chargement image:', error);
        return new Response('', { status: 404 });
    }
}

// Gestion des requêtes API (Network First)
async function handleApiRequest(request) {
    try {
        // Essayer d'abord le réseau
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            // Mettre en cache les réponses réussies
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 API hors ligne, recherche dans le cache...');
        
        // Fallback cache pour les API
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📦 Données API depuis le cache:', request.url);
            return cachedResponse;
        }
        
        // Réponse d'erreur pour les données non disponibles
        return new Response(JSON.stringify({
            error: 'Hors ligne',
            message: 'Les données ne sont pas disponibles hors ligne'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Gestion par défaut (Network First)
async function handleDefaultRequest(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Mettre en cache les pages HTML réussies
        if (networkResponse.status === 200 && 
            networkResponse.headers.get('content-type')?.includes('text/html')) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Hors ligne, recherche dans le cache...');
        
        const cache = await caches.open(DYNAMIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback vers la page d'accueil pour les routes inconnues
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Ressource non disponible hors ligne', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_RESOURCES':
            cacheAdditionalResources(payload);
            break;
            
        case 'GET_CACHE_INFO':
            sendCacheInfo(event.port || event.source);
            break;
            
        case 'CLEAR_CACHE':
            clearOldCaches();
            break;
    }
});

// Mise en cache de ressources supplémentaires
async function cacheAdditionalResources(urls) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.addAll(urls);
        console.log('✅ Ressources supplémentaires mises en cache');
    } catch (error) {
        console.error('❌ Erreur cache ressources supplémentaires:', error);
    }
}

// Envoi des informations de cache
async function sendCacheInfo(port) {
    try {
        const cacheNames = await caches.keys();
        const cacheInfo = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            cacheInfo[cacheName] = {
                size: requests.length,
                urls: requests.map(req => req.url)
            };
        }
        
        port.postMessage({
            type: 'CACHE_INFO',
            payload: cacheInfo
        });
    } catch (error) {
        console.error('❌ Erreur récupération info cache:', error);
    }
}

// Nettoyage des caches anciens
async function clearOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const cachesToDelete = cacheNames.filter(name => 
            name !== CACHE_NAME && 
            name !== STATIC_CACHE && 
            name !== DYNAMIC_CACHE
        );
        
        await Promise.all(
            cachesToDelete.map(name => caches.delete(name))
        );
        
        console.log('🗑️ Caches anciens nettoyés');
    } catch (error) {
        console.error('❌ Erreur nettoyage cache:', error);
    }
}

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    console.log('🔄 Synchronisation en arrière-plan:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Synchronisation des données en arrière-plan
async function doBackgroundSync() {
    try {
        // Récupérer les données en attente de synchronisation
        const cache = await caches.open(DYNAMIC_CACHE);
        const pendingRequests = await cache.keys();
        
        const syncPromises = pendingRequests.map(async (request) => {
            if (request.url.includes('supabase.co')) {
                try {
                    const response = await fetch(request);
                    if (response.status === 200) {
                        await cache.put(request, response);
                        console.log('✅ Donnée synchronisée:', request.url);
                    }
                } catch (error) {
                    console.error('❌ Erreur synchronisation:', request.url, error);
                }
            }
        });
        
        await Promise.allSettled(syncPromises);
        console.log('🔄 Synchronisation terminée');
    } catch (error) {
        console.error('❌ Erreur synchronisation générale:', error);
    }
}

// Gestion des push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Nouvelle notification Focus ISEP',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag || 'focus-isep-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Ouvrir'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Focus ISEP', options)
    );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Gestion de l'état de connexion
let isOnline = true;

// Surveillance de la connexion
self.addEventListener('online', () => {
    isOnline = true;
    console.log('🌐 En ligne - Synchronisation des données...');
    doBackgroundSync();
});

self.addEventListener('offline', () => {
    isOnline = false;
    console.log('📴 Hors ligne - Mode cache activé');
});

// Fonction utilitaire pour vérifier la connexion
function checkConnection() {
    return isOnline;
}

// Export pour les tests (si nécessaire)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CACHE_NAME,
        STATIC_CACHE,
        DYNAMIC_CACHE,
        isStaticAsset,
        isImageRequest,
        isApiRequest,
        checkConnection
    };
}
