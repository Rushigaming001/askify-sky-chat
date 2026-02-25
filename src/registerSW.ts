// PWA Service Worker Registration & Install Prompt Handler

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Expose globally for hooks to access
(window as any).__pwaInstallPrompt = null;

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return;
  }

  // Listen for the install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    (window as any).__pwaInstallPrompt = deferredPrompt;
    console.log('PWA install prompt captured');
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  });

  // Track successful install
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    (window as any).__pwaInstallPrompt = null;
    console.log('PWA installed successfully');
  });

  // Register the custom SW for push notifications
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('Push SW registered:', registration.scope);
    })
    .catch((error) => {
      console.error('Push SW registration failed:', error);
    });
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt || (window as any).__pwaInstallPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
  (window as any).__pwaInstallPrompt = null;
}
