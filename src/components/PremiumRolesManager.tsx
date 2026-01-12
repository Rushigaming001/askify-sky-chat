import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Crown, Sparkles, Zap, Star, Shield, Gem, Medal, Trophy, Award, Diamond } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoleBenefits {
  role: string;
  daily_message_limit: number;
  image_generation_limit: number;
  video_generation_limit: number;
  priority_support: boolean;
  custom_badge: boolean;
  advanced_models_access: boolean;
}

const PREMIUM_ROLES = [
  { role: 'plus', label: '💎 Plus', icon: Gem, color: 'text-cyan-500' },
  { role: 'pro', label: '🚀 Pro', icon: Zap, color: 'text-blue-500' },
  { role: 'elite', label: '👑 Elite', icon: Crown, color: 'text-purple-500' },
  { role: 'silver', label: '🥈 Silver', icon: Medal, color: 'text-slate-400' },
  { role: 'gold', label: '🥇 Gold', icon: Trophy, color: 'text-yellow-500' },
  { role: 'platinum', label: '💠 Platinum', icon: Diamond, color: 'text-cyan-300' },
  { role: 'basic', label: '📦 Basic', icon: Shield, color: 'text-green-500' },
  { role: 'premium', label: '⭐ Premium', icon: Star, color: 'text-pink-500' },
  { role: 'vip', label: '🌟 VIP', icon: Sparkles, color: 'text-amber-400' },
];

const DEFAULT_BENEFITS: Record<string, RoleBenefits> = {
  plus: { role: 'plus', daily_message_limit: 100, image_generation_limit: 20, video_generation_limit: 5, priority_support: false, custom_badge: true, advanced_models_access: false },
  pro: { role: 'pro', daily_message_limit: 200, image_generation_limit: 50, video_generation_limit: 10, priority_support: true, custom_badge: true, advanced_models_access: true },
  elite: { role: 'elite', daily_message_limit: 500, image_generation_limit: 100, video_generation_limit: 25, priority_support: true, custom_badge: true, advanced_models_access: true },
  silver: { role: 'silver', daily_message_limit: 75, image_generation_limit: 15, video_generation_limit: 3, priority_support: false, custom_badge: true, advanced_models_access: false },
  gold: { role: 'gold', daily_message_limit: 150, image_generation_limit: 40, video_generation_limit: 8, priority_support: true, custom_badge: true, advanced_models_access: false },
  platinum: { role: 'platinum', daily_message_limit: 300, image_generation_limit: 75, video_generation_limit: 15, priority_support: true, custom_badge: true, advanced_models_access: true },
  basic: { role: 'basic', daily_message_limit: 50, image_generation_limit: 10, video_generation_limit: 2, priority_support: false, custom_badge: false, advanced_models_access: false },
  premium: { role: 'premium', daily_message_limit: 250, image_generation_limit: 60, video_generation_limit: 12, priority_support: true, custom_badge: true, advanced_models_access: true },
  vip: { role: 'vip', daily_message_limit: 1000, image_generation_limit: 200, video_generation_limit: 50, priority_support: true, custom_badge: true, advanced_models_access: true },
};

export default function PremiumRolesManager() {
  const [benefits, setBenefits] = useState<Record<string, RoleBenefits>>(DEFAULT_BENEFITS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setLoading(true);
    try {
      // Try to load from localStorage for now (in production, use database)
      const saved = localStorage.getItem('premium_role_benefits');
      if (saved) {
        setBenefits({ ...DEFAULT_BENEFITS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBenefits = async (role: string) => {
    setSaving(role);
    try {
      // Save to localStorage (in production, save to database)
      localStorage.setItem('premium_role_benefits', JSON.stringify(benefits));
      
      // Update message limits in database for users with this role
      const { data: usersWithRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role as any);
      
      if (usersWithRole && usersWithRole.length > 0) {
        for (const { user_id } of usersWithRole) {
          await supabase
            .from('user_message_limits')
            .upsert({
              user_id,
              daily_limit: benefits[role].daily_message_limit
            });
        }
      }
      
      toast.success(`${role} benefits saved successfully`);
    } catch (error) {
      console.error('Error saving benefits:', error);
      toast.error('Failed to save benefits');
    } finally {
      setSaving(null);
    }
  };

  const updateBenefit = (role: string, field: keyof RoleBenefits, value: any) => {
    setBenefits(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value
      }
    }));
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
        <h2 className="text-2xl font-bold text-foreground">Premium Role Management</h2>
        <p className="text-muted-foreground mt-2">
          Configure benefits and restrictions for each premium role tier
        </p>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid gap-4 pr-4">
          {PREMIUM_ROLES.map(({ role, label, icon: Icon, color }) => (
            <Card key={role}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${color}`} />
                  {label}
                </CardTitle>
                <CardDescription>
                  Configure limits and permissions for {label} members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Numeric Limits */}
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-msg`}>Daily Message Limit</Label>
                    <Input
                      id={`${role}-msg`}
                      type="number"
                      value={benefits[role]?.daily_message_limit || 0}
                      onChange={(e) => updateBenefit(role, 'daily_message_limit', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-img`}>Image Generation Limit</Label>
                    <Input
                      id={`${role}-img`}
                      type="number"
                      value={benefits[role]?.image_generation_limit || 0}
                      onChange={(e) => updateBenefit(role, 'image_generation_limit', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-vid`}>Video Generation Limit</Label>
                    <Input
                      id={`${role}-vid`}
                      type="number"
                      value={benefits[role]?.video_generation_limit || 0}
                      onChange={(e) => updateBenefit(role, 'video_generation_limit', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  {/* Boolean Toggles */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <Label htmlFor={`${role}-priority`} className="text-sm">Priority Support</Label>
                    <Switch
                      id={`${role}-priority`}
                      checked={benefits[role]?.priority_support || false}
                      onCheckedChange={(checked) => updateBenefit(role, 'priority_support', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <Label htmlFor={`${role}-badge`} className="text-sm">Custom Badge</Label>
                    <Switch
                      id={`${role}-badge`}
                      checked={benefits[role]?.custom_badge || false}
                      onCheckedChange={(checked) => updateBenefit(role, 'custom_badge', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <Label htmlFor={`${role}-models`} className="text-sm">Advanced Models</Label>
                    <Switch
                      id={`${role}-models`}
                      checked={benefits[role]?.advanced_models_access || false}
                      onCheckedChange={(checked) => updateBenefit(role, 'advanced_models_access', checked)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => saveBenefits(role)} 
                  className="mt-4"
                  disabled={saving === role}
                >
                  {saving === role ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}