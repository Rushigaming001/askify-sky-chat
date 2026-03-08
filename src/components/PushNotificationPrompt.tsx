import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const prompted = useRef(false);

  useEffect(() => {
    if (!user || !isSupported || isSubscribed || prompted.current) return;
    
    // Small delay so the app loads first
    const timer = setTimeout(() => {
      if (permission === 'default') {
        prompted.current = true;
        subscribe();
      } else if (permission === 'granted' && !isSubscribed) {
        // Permission already granted but not subscribed - auto subscribe
        prompted.current = true;
        subscribe();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isSupported, isSubscribed, permission, subscribe]);

  return null;
}
