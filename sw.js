/* مكوك بيشو — الشبكة أولًا عشان نفس الرابط يجيب أحدث نسخة دايمًا، والكاش fallback أوفلاين */
var CACHE = "makkook-besho-v13";
var FILES = ["./", "index.html", "app.js", "model.js", "highs-engine.js", "19-wasm-data.js", "manifest.json", "version.json", "icon-192.png", "icon-512.png"];
/* الملفات الكبيرة الثابتة: كاش أولًا (مش بتتغير، وحجمها ٧ ميجا — منعيدش تحميلها كل مرة) */
function cacheFirst(url) {
  return url.indexOf("wasm-data.js") !== -1 || url.indexOf(".png") !== -1;
}
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  if (cacheFirst(e.request.url)) {
    e.respondWith(caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    }));
    return;
  }
  /* الشبكة أولًا: أحدث نسخة دايمًا — ولو مفيش نت، ارجع للكاش */
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () {
    return caches.match(e.request);
  }));
});
