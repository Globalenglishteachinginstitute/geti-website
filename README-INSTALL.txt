GETI PWA — FREE INSTALLABLE WEB APP
===================================

Your current GETI index already includes:
<link rel="manifest" href="/site.webmanifest">

Therefore, you only need to upload these files to the ROOT of getienglish.com:
- site.webmanifest
- service-worker.js
- pwa-loader.js
- offline.html
- geti-icon-192.png
- geti-icon-512.png

Then add ONE line just before </body> in your current index.html:

<script src="/pwa-loader.js" defer></script>

IMPORTANT
---------
1. Keep HTTPS enabled. PWA installation requires HTTPS.
2. Do not rename service-worker.js unless you also change pwa-loader.js.
3. Put all files in the website root, the same level as index.html.
4. Existing GETI login, exams, student area, results and certificate functions are not replaced.
5. The service worker uses network-first navigation so live GETI/Supabase pages remain current.
6. After publishing, open https://getienglish.com/ in Chrome Android.
7. The "INSTALL GETI APP" button appears when the browser allows installation.
8. On iPhone/iPad, use Safari > Share > Add to Home Screen.

If an older service worker was previously installed, clear site data once or increment
GETI_CACHE in service-worker.js (for example geti-pwa-v2).
