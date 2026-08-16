(function () {
  // Manifesto PWA
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.webmanifest';
    document.head.appendChild(link);
  }

  // Cor do navegador
  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#b95f79';
    document.head.appendChild(meta);
  }

  // Apple/iPhone
  const appleCapable = document.createElement('meta');
  appleCapable.name = 'apple-mobile-web-app-capable';
  appleCapable.content = 'yes';
  document.head.appendChild(appleCapable);

  const appleTitle = document.createElement('meta');
  appleTitle.name = 'apple-mobile-web-app-title';
  appleTitle.content = 'Sheila Machado';
  document.head.appendChild(appleTitle);

  const appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = '/icon-192.png';
  document.head.appendChild(appleIcon);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
  }

  let deferredPrompt = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (isStandalone) return;

  const btn = document.createElement('button');
  btn.id = 'installAppButton';
  btn.textContent = '📱 Instalar app';
  btn.style.cssText = [
    'position:fixed',
    'left:18px',
    'bottom:18px',
    'z-index:9999',
    'border:0',
    'border-radius:999px',
    'padding:13px 17px',
    'font-weight:800',
    'background:#b95f79',
    'color:#fff',
    'box-shadow:0 12px 30px #0002',
    'display:none',
    'cursor:pointer'
  ].join(';');
  document.body.appendChild(btn);

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btn.style.display = 'block';
  });

  btn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.style.display = 'none';
      return;
    }
    if (isIOS) {
      alert('No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.');
    }
  });

  // No iPhone, mostramos o botão para instruir
  if (isIOS) btn.style.display = 'block';

  window.addEventListener('appinstalled', () => {
    btn.style.display = 'none';
    deferredPrompt = null;
  });
})();