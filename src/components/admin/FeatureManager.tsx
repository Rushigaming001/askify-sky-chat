import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Blocks, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FeatureFlags {
  [key: string]: boolean;
}

export default function FeatureManager() {
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'feature_flags')
        .single();

      if (error) throw error;
      if (data?.value) {
        setFeatures(data.value as FeatureFlags);
      }
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFeatures = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: features })
        .eq('key', 'feature_flags');

      if (error) throw error;
      toast.success('Feature flags saved');
    } catch (error) {
      console.error('Error saving features:', error);
      toast.error('Failed to save features');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addFeature = () => {
    if (!newFeatureName.trim()) {
      toast.error('Please enter a feature name');
      return;
    }

    const key = newFeatureName.toLowerCase().replace(/\s+/g, '_');
    if (features[key] !== undefined) {
      toast.error('Feature already exists');
      return;
    }

    setFeatures(prev => ({ ...prev, [key]: true }));
    setNewFeatureName('');
    setShowAddDialog(false);
    toast.success('Feature added. Remember to save!');
  };

  const removeFeature = (key: string) => {
    setFeatures(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
    toast.success('Feature removed. Remember to save!');
  };

  const formatFeatureName = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Blocks className="h-5 w-5 text-primary" />
              <CardTitle>Feature Manager</CardTitle>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Feature
            </Button>
          </div>
          <CardDescription>
            Enable or disable features across the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(features).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No features configured. Add one to get started.
            </div>
          ) : (
            <div className="grid gap-3">
              {Object.entries(features).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={enabled}
                      onCheckedChange={() => toggleFeature(key)}
                    />
                    <span className="font-medium">{formatFeatureName(key)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={saveFeatures} disabled={isSaving} className="w-full mt-4">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Feature Flags'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Feature</DialogTitle>
            <DialogDescription>
              Add a new feature flag to control visibility across the app
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="featureName">Feature Name</Label>
            <Input
              id="featureName"
              value={newFeatureName}
              onChange={(e) => setNewFeatureName(e.target.value)}
              placeholder="e.g., New Chat Feature"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addFeature}>Add Feature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
