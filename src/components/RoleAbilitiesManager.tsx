import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, Star, Shield, Users, Heart, GraduationCap, BookOpen, UserCog, ShieldCheck, ShieldPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoleAbility {
  id: string;
  role: string;
  ability_name: string;
  is_allowed: boolean;
  max_target_role: string | null;
}

const roleDisplayNames: Record<string, string> = {
  'owner': 'Owner',
  'ceo': 'CEO',
  'founder': 'Founder',
  'co_founder': 'Co-Founder',
  'sr_admin': 'Senior Admin',
  'admin': 'Admin',
  'sr_moderator': 'Senior Moderator',
  'moderator': 'Moderator',
  'education_admin': 'Education Admin',
  'learning_department': 'Learning Department',
  'learning_manager': 'Learning Manager',
  'friend': 'Friend',
  'user': 'User',
  'plus': 'Plus',
  'pro': 'Pro',
  'elite': 'Elite',
  'silver': 'Silver',
  'gold': 'Gold',
  'platinum': 'Platinum',
  'basic': 'Basic',
  'premium': 'Premium',
  'vip': 'VIP'
};

const roleIcons: Record<string, React.ReactNode> = {
  'owner': <Crown className="h-4 w-4 text-yellow-500" />,
  'ceo': <Star className="h-4 w-4 text-purple-500" />,
  'founder': <Star className="h-4 w-4 text-blue-500" />,
  'co_founder': <Star className="h-4 w-4 text-cyan-500" />,
  'sr_admin': <ShieldPlus className="h-4 w-4 text-red-600" />,
  'admin': <Shield className="h-4 w-4 text-red-500" />,
  'sr_moderator': <ShieldCheck className="h-4 w-4 text-orange-600" />,
  'moderator': <Shield className="h-4 w-4 text-orange-500" />,
  'education_admin': <GraduationCap className="h-4 w-4 text-indigo-500" />,
  'learning_department': <BookOpen className="h-4 w-4 text-teal-500" />,
  'learning_manager': <UserCog className="h-4 w-4 text-emerald-500" />,
  'friend': <Heart className="h-4 w-4 text-pink-500" />,
  'user': <Users className="h-4 w-4 text-gray-500" />
};

const abilityDisplayNames: Record<string, string> = {
  'assign_roles': 'Assign Roles to Users',
  'ban_from_app': 'Permanently Ban from App',
  'temp_ban_from_app': 'Temporarily Ban from App',
  'ban_from_public_chat': 'Ban from Public Chat',
  'ban_from_groups': 'Ban from Groups',
  'ban_from_dms': 'Ban from Direct Messages',
  'delete_messages': 'Delete User Messages',
  'timeout_users': 'Timeout Users',
  'view_user_data': 'View User Data',
  'edit_user_profiles': 'Edit User Profiles',
  'manage_permissions': 'Manage Permissions'
};

const abilityDescriptions: Record<string, string> = {
  'assign_roles': 'Allow this role to assign roles to other users (up to their max target role)',
  'ban_from_app': 'Allow this role to permanently ban users from the entire app',
  'temp_ban_from_app': 'Allow this role to temporarily ban users from the entire app',
  'ban_from_public_chat': 'Allow this role to ban users from public chat',
  'ban_from_groups': 'Allow this role to ban users from groups',
  'ban_from_dms': 'Allow this role to ban users from direct messages',
  'delete_messages': 'Allow this role to delete messages from other users',
  'timeout_users': 'Allow this role to timeout users temporarily',
  'view_user_data': 'Allow this role to view detailed user data',
  'edit_user_profiles': 'Allow this role to edit user profiles',
  'manage_permissions': 'Allow this role to manage role permissions'
};

// Role hierarchy (higher index = higher rank)
const roleHierarchy = [
  'user', 'basic', 'plus', 'pro', 'silver', 'gold', 'elite', 'platinum', 'premium', 'vip',
  'friend', 'learning_manager', 'learning_department', 'education_admin',
  'moderator', 'sr_moderator', 'admin', 'sr_admin', 
  'co_founder', 'founder', 'ceo', 'owner'
];

export default function RoleAbilitiesManager() {
  const [abilities, setAbilities] = useState<RoleAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadAbilities();
  }, []);

  const loadAbilities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('role_abilities')
      .select('*')
      .order('role');

    if (error) {
      console.error('Error fetching role abilities:', error);
      toast.error('Failed to load role abilities');
    } else {
      setAbilities(data || []);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, currentValue: boolean) => {
    setUpdating(id);
    
    const { error } = await supabase
      .from('role_abilities')
      .update({ is_allowed: !currentValue, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating ability:', error);
      toast.error('Failed to update ability');
    } else {
      toast.success('Ability updated successfully');
      await loadAbilities();
    }
    
    setUpdating(null);
  };

  const handleMaxRoleChange = async (id: string, newMaxRole: string | null) => {
    setUpdating(id);
    
    const { error } = await supabase
      .from('role_abilities')
      .update({ 
        max_target_role: newMaxRole === 'none' ? null : newMaxRole as any,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating max role:', error);
      toast.error('Failed to update max target role');
    } else {
      toast.success('Max target role updated');
      await loadAbilities();
    }
    
    setUpdating(null);
  };

  const getRoleAbilities = (role: string) => {
    return abilities.filter(a => a.role === role);
  };

  const getAvailableTargetRoles = (currentRole: string): string[] => {
    const currentIndex = roleHierarchy.indexOf(currentRole);
    // Can only target roles below the current role
    return roleHierarchy.slice(0, currentIndex);
  };

  const uniqueRoles = Array.from(new Set(abilities.map(a => a.role)));
  // Sort roles by hierarchy
  const sortedRoles = uniqueRoles.sort((a, b) => roleHierarchy.indexOf(b) - roleHierarchy.indexOf(a));

  // Only show staff/management roles for abilities
  const staffRoles = sortedRoles.filter(r => 
    ['owner', 'ceo', 'founder', 'co_founder', 'sr_admin', 'admin', 'sr_moderator', 
     'moderator', 'education_admin', 'learning_department', 'learning_manager'].includes(r)
  );

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
        <h2 className="text-2xl font-bold text-foreground">Role Abilities</h2>
        <p className="text-muted-foreground mt-2">
          Control what each role can do - assign roles, ban users, etc. Only staff roles are shown.
        </p>
      </div>

      <div className="grid gap-4">
        {staffRoles.map(role => {
          const roleAbilities = getRoleAbilities(role);
          const availableTargetRoles = getAvailableTargetRoles(role);
          
          return (
            <Card key={role}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {roleIcons[role] || <Users className="h-4 w-4" />}
                  {roleDisplayNames[role] || role}
                </CardTitle>
                <CardDescription>
                  Configure abilities for {roleDisplayNames[role] || role} role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roleAbilities.map(ability => {
                    const isUpdating = updating === ability.id;
                    const showMaxRole = ability.ability_name === 'assign_roles' && ability.is_allowed;
                    
                    return (
                      <div key={ability.id} className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                          <div className="flex-1">
                            <Label htmlFor={ability.id} className="text-sm font-medium">
                              {abilityDisplayNames[ability.ability_name] || ability.ability_name}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {abilityDescriptions[ability.ability_name]}
                            </p>
                          </div>
                          <Switch
                            id={ability.id}
                            checked={ability.is_allowed}
                            onCheckedChange={() => handleToggle(ability.id, ability.is_allowed)}
                            disabled={isUpdating || role === 'owner'}
                          />
                        </div>
                        
                        {showMaxRole && availableTargetRoles.length > 0 && (
                          <div className="ml-4 p-3 rounded-lg bg-muted/30 border border-dashed">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Max role this role can assign:
                            </Label>
                            <Select
                              value={ability.max_target_role || 'none'}
                              onValueChange={(value) => handleMaxRoleChange(ability.id, value)}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="mt-1 w-48">
                                <SelectValue placeholder="Select max role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No restriction</SelectItem>
                                {availableTargetRoles.map(r => (
                                  <SelectItem key={r} value={r}>
                                    {roleDisplayNames[r] || r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Users with this role can only assign roles up to and including this level
                            </p>
                          </div>
                        )}
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
