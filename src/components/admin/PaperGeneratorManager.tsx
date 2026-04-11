import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Lock, UserPlus, Trash2, FileText, Shield, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AllowedUser {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { name: string; email: string };
}

interface ActivityLog {
  id: string;
  user_name: string;
  user_email: string;
  paper_class: string;
  subject: string;
  generation_type: string;
  total_marks: string;
  difficulty: string;
  created_at: string;
}

export default function PaperGeneratorManager() {
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [settingsId, setSettingsId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadAllowedUsers(), loadActivity()]);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from('paper_generator_settings')
      .select('*')
      .limit(1)
      .single();
    if (data) {
      setSettingsId(data.id);
      setPasswordEnabled(data.password_enabled);
      setWhitelistEnabled(data.whitelist_enabled);
      setCurrentPassword(data.password_hash || '');
    }
  };

  const loadAllowedUsers = async () => {
    const { data } = await supabase
      .from('paper_generator_allowed_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch profiles for each user
      const userIds = data.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setAllowedUsers(data.map(u => ({
        ...u,
        profile: profileMap.get(u.user_id) || { name: 'Unknown', email: '' }
      })));
    }
  };

  const loadActivity = async () => {
    const { data } = await supabase
      .from('paper_generator_activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setActivity((data || []) as ActivityLog[]);
  };

  const saveSettings = async () => {
    if (!settingsId) return;
    const { error } = await supabase
      .from('paper_generator_settings')
      .update({
        password_enabled: passwordEnabled,
        password_hash: password || currentPassword,
        whitelist_enabled: whitelistEnabled,
      })
      .eq('id', settingsId);
    
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Paper generator settings saved');
      setPassword('');
      loadSettings();
    }
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .or(`email.ilike.%${searchEmail}%,name.ilike.%${searchEmail}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const addUser = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('paper_generator_allowed_users')
      .insert({ user_id: userId, added_by: user.id });
    
    if (error) {
      if (error.code === '23505') {
        toast.error('User is already on the whitelist');
      } else {
        toast.error('Failed to add user');
      }
    } else {
      toast.success('User added to whitelist');
      setSearchEmail('');
      setSearchResults([]);
      loadAllowedUsers();
    }
  };

  const removeUser = async (id: string) => {
    const { error } = await supabase
      .from('paper_generator_allowed_users')
      .delete()
      .eq('id', id);
    
    if (!error) {
      toast.success('User removed from whitelist');
      loadAllowedUsers();
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;

  return (
    <Tabs defaultValue="settings" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="settings" className="flex-1 gap-1">
          <Lock className="h-3 w-3" /> Settings
        </TabsTrigger>
        <TabsTrigger value="whitelist" className="flex-1 gap-1">
          <Shield className="h-3 w-3" /> Whitelist
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex-1 gap-1">
          <Eye className="h-3 w-3" /> Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Paper Generator Security
            </CardTitle>
            <CardDescription>Control who can access the paper generator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">Password Protection</Label>
                <p className="text-sm text-muted-foreground">Require a password to use the paper generator</p>
              </div>
              <Switch checked={passwordEnabled} onCheckedChange={setPasswordEnabled} />
            </div>

            {passwordEnabled && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                <Label>Set Password</Label>
                <Input
                  type="password"
                  placeholder={currentPassword ? '••••••• (leave blank to keep current)' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {currentPassword && (
                  <p className="text-xs text-muted-foreground">Current password is set. Leave blank to keep it.</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label className="text-base font-medium">User Whitelist</Label>
                <p className="text-sm text-muted-foreground">Only allow specific users to generate papers</p>
              </div>
              <Switch checked={whitelistEnabled} onCheckedChange={setWhitelistEnabled} />
            </div>

            <Button onClick={saveSettings} className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="whitelist">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Allowed Users ({allowedUsers.length})
            </CardTitle>
            <CardDescription>Users who can access the paper generator when whitelist is enabled</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
              <Button onClick={searchUsers} size="sm">Search</Button>
            </div>

            {searchResults.length > 0 && (
              <div className="border rounded-lg divide-y">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addUser(user.id)}>
                      <UserPlus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {allowedUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No users in whitelist</p>
                ) : (
                  allowedUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{u.profile?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{u.profile?.email}</p>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => removeUser(u.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Paper Generation Activity
            </CardTitle>
            <CardDescription>{activity.length} papers generated</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {activity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No activity yet</p>
                ) : (
                  activity.map(a => (
                    <div key={a.id} className="p-3 border rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{a.user_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {a.generation_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {a.paper_class}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {a.subject}
                        </span>
                        {a.total_marks && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                            {a.total_marks} marks
                          </span>
                        )}
                        {a.difficulty && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                            {a.difficulty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.user_email}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
