const CACHE = 'voxel-survivor-v17';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/main.js',
    './js/state.js',
    './js/config.js',
    './js/storage.js',
    './js/models/index.js',
    './js/models/parts.js',
    './js/models/zombie.js',
    './js/models/boss.js',
    './js/models/weapon.js',
    './js/models/pickup.js',
    './js/audio.js',
    './js/effects.js',
    './js/weapons.js',
    './js/zombies.js',
    './js/waves.js',
    './js/ui.js',
    './js/progression.js',
    './js/lobby.js',
    './js/input.js',
    './js/world.js',
    './js/mods.js',
    './js/textures.js',
    './js/intro.js',
    './js/music.js',
    './manifest.json',
    './icon.svg'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => k.startsWith('voxel-survivor-') && k !== CACHE)
            .map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', e => {
    if(e.request.method !== 'GET') return;
    if(e.request.mode === 'navigate'){
        e.respondWith(fetch(e.request).then(r => {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
            return r;
        }).catch(() => caches.match('./index.html')));
        return;
    }
    if(e.request.url.includes('cdnjs.cloudflare.com')){
        e.respondWith(fetch(e.request).then(r => {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
            return r;
        }).catch(() => caches.match(e.request)));
        return;
    }
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
