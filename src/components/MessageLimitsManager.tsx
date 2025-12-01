import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Edit2, Save, X } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  name: string;
}

interface MessageLimit {
  user_id: string;
  daily_limit: number;
}

export default function MessageLimitsManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('20');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .order('name');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load all message limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('user_message_limits')
        .select('user_id, daily_limit');

      if (limitsError) throw limitsError;

      const limitsMap: Record<string, number> = {};
      limitsData?.forEach((limit: MessageLimit) => {
        limitsMap[limit.user_id] = limit.daily_limit;
      });
      setLimits(limitsMap);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load message limits');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLimit = (userId: string, currentLimit: number) => {
    setEditingUserId(userId);
    setEditLimit(currentLimit.toString());
  };

  const handleSaveLimit = async (userId: string) => {
    const newLimit = parseInt(editLimit);
    
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      // Check if limit exists
      const { data: existing } = await supabase
        .from('user_message_limits')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing limit
        const { error } = await supabase
          .from('user_message_limits')
          .update({ daily_limit: newLimit })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new limit
        const { error } = await supabase
          .from('user_message_limits')
          .insert({ user_id: userId, daily_limit: newLimit });

        if (error) throw error;
      }

      toast.success('Message limit updated successfully');
      setEditingUserId(null);
      loadData();
    } catch (error: any) {
      console.error('Error updating limit:', error);
      toast.error('Failed to update message limit');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditLimit('20');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Limit Management</CardTitle>
        <CardDescription>
          Set custom daily message limits for users (default: 20 messages/day)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {profiles.map((profile) => {
            const currentLimit = limits[profile.id] || 20;
            const isEditing = editingUserId === profile.id;

            return (
              <div
                key={profile.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-semibold">{profile.name}</div>
                  <div className="text-sm text-muted-foreground">{profile.email}</div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`limit-${profile.id}`} className="text-sm">
                        Daily Limit:
                      </Label>
                      <Input
                        id={`limit-${profile.id}`}
                        type="number"
                        min="0"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        className="w-24"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSaveLimit(profile.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {currentLimit} messages/day
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentLimit === 20 ? 'Default limit' : 'Custom limit'}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditLimit(profile.id, currentLimit)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}

          {profiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}