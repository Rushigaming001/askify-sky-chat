import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Construction, Save, RefreshCw } from 'lucide-react';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  features: Record<string, boolean>;
}

const FEATURE_LIST = [
  { key: 'public_chat', label: 'Public Chat' },
  { key: 'ai_chat', label: 'AI Chat' },
  { key: 'dm', label: 'Direct Messages' },
  { key: 'voice_calls', label: 'Voice Calls' },
  { key: 'video_calls', label: 'Video Calls' },
  { key: 'image_generation', label: 'Image Generation' },
  { key: 'video_generation', label: 'Video Generation' },
  { key: 'language_learning', label: 'Language Learning' },
  { key: 'data_analyzer', label: 'Data Analyzer' },
  { key: 'games', label: 'Games' },
];

export default function MaintenanceManager() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    features: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (error) throw error;
      if (data?.value) {
        setSettings(data.value as unknown as MaintenanceSettings);
      }
    } catch (error) {
      console.error('Error loading maintenance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: JSON.parse(JSON.stringify(settings)) })
        .eq('key', 'maintenance_mode');

      if (error) throw error;
      toast.success('Maintenance settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGlobalMaintenance = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const toggleFeatureMaintenance = (featureKey: string) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Construction className="h-5 w-5 text-warning" />
          <CardTitle>Maintenance Mode</CardTitle>
        </div>
        <CardDescription>
          Control app-wide or feature-specific maintenance mode
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Maintenance */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Global Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              {settings.enabled ? 'App is under maintenance for all users except Owner' : 'App is accessible to all users'}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={toggleGlobalMaintenance}
          />
        </div>

        {/* Maintenance Message */}
        <div className="space-y-2">
          <Label>Maintenance Message</Label>
          <Textarea
            value={settings.message}
            onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Message to show users during maintenance..."
            rows={3}
          />
        </div>

        {/* Feature-specific Maintenance */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Feature-Specific Maintenance</Label>
          <p className="text-sm text-muted-foreground">
            Put individual features under maintenance without affecting the whole app
          </p>
          
          <div className="grid gap-3 mt-4">
            {FEATURE_LIST.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg border">
                <span>{feature.label}</span>
                <Switch
                  checked={settings.features[feature.key] || false}
                  onCheckedChange={() => toggleFeatureMaintenance(feature.key)}
                  disabled={settings.enabled}
                />
              </div>
            ))}
          </div>
        </div>

        <Button onClick={saveSettings} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Maintenance Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
