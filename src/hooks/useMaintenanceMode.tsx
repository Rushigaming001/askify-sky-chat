import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  features: Record<string, boolean>;
}

export function useMaintenanceMode() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    features: {}
  });
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadMaintenanceSettings();
    checkOwnerStatus();
    
    // Subscribe to changes
    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.maintenance_mode'
        },
        (payload) => {
          if (payload.new && 'value' in payload.new) {
            setMaintenanceSettings(payload.new.value as MaintenanceSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadMaintenanceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (error) throw error;
      if (data?.value) {
        setMaintenanceSettings(data.value as unknown as MaintenanceSettings);
      }
    } catch (error) {
      console.error('Error loading maintenance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOwnerStatus = async () => {
    if (!user) {
      setIsOwner(false);
      return;
    }

    try {
      const { data } = await supabase.rpc('is_owner', { _user_id: user.id });
      setIsOwner(!!data);
    } catch (error) {
      console.error('Error checking owner status:', error);
      setIsOwner(false);
    }
  };

  const updateMaintenanceSettings = async (settings: Partial<MaintenanceSettings>) => {
    const newSettings = { ...maintenanceSettings, ...settings };
    
    const { error } = await supabase
      .from('app_settings')
      .update({ value: newSettings })
      .eq('key', 'maintenance_mode');

    if (error) throw error;
    setMaintenanceSettings(newSettings);
  };

  const isFeatureUnderMaintenance = (featureName: string): boolean => {
    if (isOwner) return false; // Owner bypasses maintenance
    if (maintenanceSettings.enabled) return true; // Global maintenance
    return maintenanceSettings.features[featureName] === true;
  };

  const isAppUnderMaintenance = (): boolean => {
    if (isOwner) return false;
    return maintenanceSettings.enabled;
  };

  return {
    isLoading,
    maintenanceSettings,
    isOwner,
    isAppUnderMaintenance,
    isFeatureUnderMaintenance,
    updateMaintenanceSettings,
    refresh: loadMaintenanceSettings
  };
}
