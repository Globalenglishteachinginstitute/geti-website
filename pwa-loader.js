(() => {
  // iOS / PWA metadata injected without changing GETI functions.
  const ensureMeta = (name, content) => {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  };
  ensureMeta('apple-mobile-web-app-capable', 'yes');
  ensureMeta('apple-mobile-web-app-status-bar-style', 'default');
  ensureMeta('mobile-web-app-capable', 'yes');

  // Register the GETI service worker.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .catch(err => console.warn('GETI PWA service worker:', err));
    });
  }

  // Install button for browsers that support beforeinstallprompt.
  let deferredPrompt = null;
  let installBtn = null;

  const createInstallButton = () => {
    if (installBtn || window.matchMedia('(display-mode: standalone)').matches) return;
    installBtn = document.createElement('button');
    installBtn.type = 'button';
    installBtn.textContent = '⬇ INSTALL GETI APP';
    installBtn.setAttribute('aria-label', 'Install GETI App');
    Object.assign(installBtn.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '99999',
      border: '0',
      borderRadius: '999px',
      padding: '12px 18px',
      background: '#082e5d',
      color: '#ffffff',
      fontWeight: '800',
      boxShadow: '0 8px 24px rgba(0,0,0,.20)',
      cursor: 'pointer',
      fontSize: '13px'
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.remove();
      installBtn = null;
    });

    document.body.appendChild(installBtn);
  };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    createInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.remove();
    installBtn = null;
  });
})();
