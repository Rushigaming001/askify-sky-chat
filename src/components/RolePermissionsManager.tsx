import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Unlock, Crown, Star, Shield, Users, Heart } from 'lucide-react';

interface RolePermission {
  id: string;
  role: string;
  permission_name: string;
  is_allowed: boolean;
}

const roleDisplayNames: Record<string, string> = {
  'owner': 'Owner',
  'ceo': 'CEO',
  'founder': 'Founder',
  'co_founder': 'Co-Founder',
  'admin': 'Admin',
  'moderator': 'Moderator',
  'friend': 'Friend',
  'user': 'User'
};

const roleIcons: Record<string, React.ReactNode> = {
  'owner': <Crown className="h-4 w-4 text-yellow-500" />,
  'ceo': <Star className="h-4 w-4 text-purple-500" />,
  'founder': <Star className="h-4 w-4 text-blue-500" />,
  'co_founder': <Star className="h-4 w-4 text-cyan-500" />,
  'admin': <Shield className="h-4 w-4 text-red-500" />,
  'moderator': <Shield className="h-4 w-4 text-orange-500" />,
  'friend': <Heart className="h-4 w-4 text-pink-500" />,
  'user': <Users className="h-4 w-4 text-gray-500" />
};

const permissionDisplayNames: Record<string, string> = {
  'public_chat': 'Public Chat',
  'direct_messages': 'Direct Messages',
  'groups': 'Groups',
  'ai_chat': 'AI Chat',
  'image_generation': 'Image Generation',
  'video_generation': 'Video Generation',
  'math_solver': 'Math Solver',
  'live_video_call': 'Live Video Call',
  'minecraft_plugin': 'Minecraft Plugin',
  'voice_chat': 'Voice Chat'
};

export default function RolePermissionsManager() {
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role');

    if (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to load role permissions');
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, currentValue: boolean) => {
    setUpdating(id);
    
    const { error } = await supabase
      .from('role_permissions')
      .update({ is_allowed: !currentValue })
      .eq('id', id);

    if (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    } else {
      toast.success('Permission updated successfully');
      await loadPermissions();
    }
    
    setUpdating(null);
  };

  const getRolePermissions = (role: string) => {
    return permissions.filter(p => p.role === role);
  };

  const uniqueRoles = Array.from(new Set(permissions.map(p => p.role)));
  // Sort roles by hierarchy
  const roleOrder = ['owner', 'ceo', 'founder', 'co_founder', 'admin', 'moderator', 'friend', 'user'];
  const sortedRoles = uniqueRoles.sort((a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b));

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
        <h2 className="text-2xl font-bold text-foreground">Role Permissions</h2>
        <p className="text-muted-foreground mt-2">
          Control what each role can access in the application
        </p>
      </div>

      <div className="grid gap-4">
        {sortedRoles.map(role => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {roleIcons[role]}
                {roleDisplayNames[role] || role}
              </CardTitle>
              <CardDescription>
                Manage permissions for {roleDisplayNames[role] || role} role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getRolePermissions(role).map(permission => {
                  const isUpdating = updating === permission.id;
                  
                  return (
                    <div key={permission.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <Label htmlFor={permission.id} className="flex items-center gap-2">
                        {permission.is_allowed ? (
                          <Unlock className="h-4 w-4 text-green-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-red-500" />
                        )}
                        {permissionDisplayNames[permission.permission_name] || permission.permission_name}
                      </Label>
                      <Switch
                        id={permission.id}
                        checked={permission.is_allowed}
                        onCheckedChange={() => handleToggle(permission.id, permission.is_allowed)}
                        disabled={isUpdating || role === 'owner'}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}