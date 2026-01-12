import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Mail, Shield, Circle } from 'lucide-react';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  roles: string[];
  status: 'online' | 'offline' | 'away';
}

const getRoleBadgeStyle = (role: string) => {
  const styles: Record<string, string> = {
    owner: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    founder: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    co_founder: 'bg-gradient-to-r from-orange-400 to-red-500 text-white',
    ceo: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    admin: 'bg-gradient-to-r from-red-500 to-rose-600 text-white',
    moderator: 'bg-gradient-to-r from-orange-500 to-amber-600 text-white',
    friend: 'bg-gradient-to-r from-pink-400 to-rose-500 text-white',
    vip: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-black',
    premium: 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white',
    platinum: 'bg-gradient-to-r from-slate-300 via-cyan-200 to-slate-400 text-slate-800',
    gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    silver: 'bg-gradient-to-r from-slate-300 to-gray-400 text-slate-700',
    elite: 'bg-gradient-to-r from-violet-600 to-purple-700 text-white',
    pro: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
    plus: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
    basic: 'bg-gradient-to-r from-emerald-400 to-green-500 text-white',
  };
  return styles[role] || 'bg-muted text-muted-foreground';
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    owner: '👑 Owner',
    founder: '⭐ Founder',
    co_founder: '✦ Co-Founder',
    ceo: '💎 CEO',
    admin: '🛡️ Admin',
    moderator: '⚔️ Moderator',
    friend: '💖 Friend',
    vip: '✨ VIP',
    premium: '💫 Premium',
    platinum: '🏆 Platinum',
    gold: '🥇 Gold',
    silver: '🥈 Silver',
    elite: '🔥 Elite',
    pro: '⚡ Pro',
    plus: '➕ Plus',
    basic: '✓ Basic',
    user: '👤 User',
  };
  return labels[role] || role;
};

export function UserProfileDialog({ open, onOpenChange, userId, userName }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      loadUserProfile();
    }
  }, [open, userId]);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      // Fetch presence
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('status')
        .eq('user_id', userId)
        .single();

      setProfile({
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        created_at: profileData.created_at,
        roles: rolesData?.map(r => r.role) || ['user'],
        status: (presenceData?.status as 'online' | 'offline' | 'away') || 'offline'
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'away': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      default: return 'Offline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background ${
                  profile.status === 'online' ? 'bg-green-500' : 
                  profile.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{profile.name}</h3>
              <div className={`flex items-center gap-1 text-sm ${getStatusColor(profile.status)}`}>
                <Circle className="h-2 w-2 fill-current" />
                {getStatusLabel(profile.status)}
              </div>
            </div>

            <Separator />

            {/* Roles */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Shield className="h-4 w-4" />
                <span>Roles</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.roles.length > 0 ? (
                  profile.roles.map(role => (
                    <Badge 
                      key={role} 
                      className={`${getRoleBadgeStyle(role)} border-0`}
                    >
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="secondary">👤 User</Badge>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>

            {/* Join Date */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Joined</span>
              </div>
              <p className="text-sm font-medium">{formatDate(profile.created_at)}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            User not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}