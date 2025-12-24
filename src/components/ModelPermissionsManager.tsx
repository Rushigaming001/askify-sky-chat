import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getModelPermissions, updateModelPermission, ModelPermission } from '@/services/modelPermissionService';
import { Loader2, Lock, Unlock, Sparkles, Zap, Brain, Image, Video } from 'lucide-react';

const ALL_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', category: 'chat', icon: Zap },
  { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', category: 'chat', icon: Zap },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (ASKIFY-PRO)', category: 'chat', icon: Sparkles },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', category: 'chat', icon: Sparkles },
  { id: 'google/gemini-2.5-flash-image-preview', name: 'Gemini Image Generation', category: 'image', icon: Image },
  { id: 'google/gemini-3-pro-image-preview', name: 'Gemini 3 Image Generation', category: 'image', icon: Image },
  { id: 'openai/gpt-5', name: 'GPT-5', category: 'chat', icon: Brain },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', category: 'chat', icon: Brain },
  { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', category: 'chat', icon: Brain },
  { id: 'meta/llama-3.1-8b-instruct', name: 'NVIDIA Llama 3.1 8B', category: 'chat', icon: Zap },
  { id: 'groq-vision', name: 'Groq Vision', category: 'vision', icon: Image },
  { id: 'ai-horde-sdxl', name: 'AI Horde SDXL', category: 'image', icon: Image },
  { id: 'gemini-image', name: 'Gemini Image', category: 'image', icon: Image },
  { id: 'gemini-vision', name: 'Gemini Vision', category: 'vision', icon: Image },
  { id: 'video-ai', name: 'Video AI', category: 'video', icon: Video },
];

const ALL_ROLES = ['user', 'friend', 'moderator', 'admin', 'co_founder', 'founder', 'ceo', 'owner'] as const;

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

  const handleToggle = async (modelId: string, role: string, currentValue: boolean) => {
    setUpdating(`${modelId}-${role}`);
    const success = await updateModelPermission(modelId, role as any, !currentValue);
    
    if (success) {
      toast.success('Permission updated successfully');
      await loadPermissions();
    } else {
      toast.error('Failed to update permission');
    }
    
    setUpdating(null);
  };

  const getPermissionForRole = (modelId: string, role: string) => {
    return permissions.find(p => p.model_id === modelId && p.role === role);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'chat': return 'bg-primary/10 text-primary';
      case 'image': return 'bg-pink-500/10 text-pink-500';
      case 'vision': return 'bg-purple-500/10 text-purple-500';
      case 'video': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

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
        {ALL_MODELS.map(model => {
          const ModelIcon = model.icon;
          return (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className={`p-2 rounded-lg ${getCategoryColor(model.category)}`}>
                    <ModelIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <span>{model.name}</span>
                    <Badge variant="outline" className="ml-2 text-2xs capitalize">
                      {model.category}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground">
                  {model.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALL_ROLES.map(role => {
                    const permission = getPermissionForRole(model.id, role);
                    const isUpdating = updating === `${model.id}-${role}`;
                    const isAllowed = permission?.is_allowed || false;
                    
                    return (
                      <div key={role} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <Label 
                          htmlFor={`${model.id}-${role}`} 
                          className="flex items-center gap-1.5 text-xs capitalize cursor-pointer"
                        >
                          {isAllowed ? (
                            <Unlock className="h-3 w-3 text-green-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-red-500" />
                          )}
                          <span className="truncate">{role.replace('_', ' ')}</span>
                        </Label>
                        <Switch
                          id={`${model.id}-${role}`}
                          checked={isAllowed}
                          onCheckedChange={() => handleToggle(model.id, role, isAllowed)}
                          disabled={isUpdating}
                          className="scale-75"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}