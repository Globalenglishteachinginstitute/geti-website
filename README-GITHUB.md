# GETI GitHub Pages PWA

Upload ALL files in this folder to the ROOT of your GitHub Pages repository.

Required root files:
- index.html
- site.webmanifest
- service-worker.js
- pwa-loader.js
- offline.html
- geti-icon-192.png
- geti-icon-512.png

Important:
- Do not put these files inside a subfolder if your site is served from the domain root.
- Commit the changes to the branch used by GitHub Pages.
- After deployment, open the live GETI website in Chrome and refresh once.
- The PWA install prompt may appear when browser installability requirements are satisfied.
