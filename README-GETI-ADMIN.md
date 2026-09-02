# GETI ADMIN — WINDOWS + ANDROID APK

This package is separate from the existing GETI student/mobile PWA.
It does NOT remove or replace the student app.

## A. Upload Admin web app to GitHub Pages
Upload the folder `admin` to the ROOT of the same GETI repository.

The live admin URL will be:
https://getienglish.com/admin/

Files:
- admin/index.html
- admin/manifest.webmanifest
- admin/service-worker.js
- admin/offline.html
- admin/geti-admin-192.png
- admin/geti-admin-512.png

The admin service worker is scoped only to `/admin/`, so it does not replace
the main GETI student PWA service worker.

## B. Install GETI Admin on Windows
After GitHub Pages deploys:
1. Open https://getienglish.com/admin/ in Microsoft Edge or Chrome.
2. Choose Install GETI Admin / Apps > Install this site as an app.
3. Pin it to Start, taskbar, or desktop if offered.

## C. Build the special Android Admin APK for FREE on GitHub
Upload these too:
- android-admin-app/
- .github/workflows/build-geti-admin-apk.yml

Then:
1. Open the GitHub repository.
2. Click `Actions`.
3. Open `Build GETI Admin APK`.
4. Click `Run workflow`.
5. When finished, open the run.
6. Under `Artifacts`, download `GETI-Admin-APK`.
7. Inside the downloaded artifact is `app-debug.apk`.

The APK opens ONLY:
https://getienglish.com/admin/

The APK supports JavaScript, cookies, file selection/upload, external links,
and browser downloads while keeping the admin UI separate from the student app.

## Important security note
The administration interface is preserved as supplied. A packaged app does not
by itself make client-side admin credentials secret. For stronger protection,
move admin authentication/authorization to Supabase/server-side roles and policies.
