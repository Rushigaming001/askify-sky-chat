import { useState, useEffect, useCallback } from 'react';
import { getDeferredPrompt, clearDeferredPrompt, BeforeInstallPromptEvent } from '@/registerSW';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if prompt is already captured
    if (getDeferredPrompt()) {
      setIsInstallable(true);
    }

    const onAvailable = () => setIsInstallable(true);
    window.addEventListener('pwa-install-available', onAvailable);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('pwa-install-available', onAvailable);
    };
  }, []);

  const installPWA = useCallback(async () => {
    if (isInstalled) return 'already-installed';

    const prompt = getDeferredPrompt();
    if (!prompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        clearDeferredPrompt();
        setIsInstallable(false);
        setIsInstalled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [isInstalled]);

  return { isInstallable, installPWA, isInstalled };
}
