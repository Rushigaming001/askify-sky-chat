import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getModelPermissions, updateModelPermission, ModelPermission } from '@/services/modelPermissionService';
import { Loader2, Lock, Unlock } from 'lucide-react';

const modelNames: Record<string, string> = {
  'google/gemini-2.5-flash': 'Gemini Flash',
  'openai/gpt-5': 'GPT-5',
  'openai/gpt-5-mini': 'GPT-5 Mini',
  'openai/gpt-5-nano': 'GPT-5 Nano',
  'google/gemini-3-pro-preview': 'Gemini 3 Pro',
  'google/gemini-2.5-pro': 'ASKIFY-PRO'
};

export default function ModelPermissionsManager() {
  const [permissions, setPermissions] = useState<ModelPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    const data = await getModelPermissions();
    setPermissions(data);
    setLoading(false);
  };

  const handleToggle = async (modelId: string, role: 'user' | 'admin' | 'owner', currentValue: boolean) => {
    setUpdating(`${modelId}-${role}`);
    const success = await updateModelPermission(modelId, role, !currentValue);
    
    if (success) {
      toast.success('Permission updated successfully');
      await loadPermissions();
    } else {
      toast.error('Failed to update permission');
    }
    
    setUpdating(null);
  };

  const getPermissionForRole = (modelId: string, role: 'user' | 'admin' | 'owner') => {
    return permissions.find(p => p.model_id === modelId && p.role === role);
  };

  const uniqueModels = Array.from(new Set(permissions.map(p => p.model_id)));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Model Access Control</h2>
        <p className="text-muted-foreground mt-2">
          Manage which AI models are available to different user roles
        </p>
      </div>

      <div className="grid gap-4">
        {uniqueModels.map(modelId => (
          <Card key={modelId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {modelNames[modelId] || modelId}
              </CardTitle>
              <CardDescription>
                Control access for different user roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['user', 'admin', 'owner'] as const).map(role => {
                const permission = getPermissionForRole(modelId, role);
                const isUpdating = updating === `${modelId}-${role}`;
                
                return (
                  <div key={role} className="flex items-center justify-between">
                    <Label htmlFor={`${modelId}-${role}`} className="flex items-center gap-2 capitalize">
                      {permission?.is_allowed ? (
                        <Unlock className="h-4 w-4 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-red-500" />
                      )}
                      {role}
                    </Label>
                    <Switch
                      id={`${modelId}-${role}`}
                      checked={permission?.is_allowed || false}
                      onCheckedChange={() => handleToggle(modelId, role, permission?.is_allowed || false)}
                      disabled={isUpdating}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
