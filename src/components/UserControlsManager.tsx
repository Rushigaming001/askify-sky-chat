import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Lock, MessageSquare, Image, Video, Calculator, Camera, Wrench, Mic, MessageCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  id: string;
  email: string;
  name: string;
}

interface UserRestriction {
  user_id: string;
  banned_from_public_chat: boolean;
  banned_from_direct_messages: boolean;
  banned_from_groups: boolean;
  image_generation_disabled: boolean;
  video_generation_disabled: boolean;
  math_solver_disabled: boolean;
  live_video_call_disabled: boolean;
  minecraft_plugin_disabled: boolean;
  voice_chat_disabled: boolean;
  ai_chat_disabled: boolean;
}

export default function UserControlsManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [restrictions, setRestrictions] = useState<Record<string, UserRestriction>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Load restrictions
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('user_restrictions')
        .select('*');

      if (restrictionsError) throw restrictionsError;

      const restrictionsMap: Record<string, UserRestriction> = {};
      restrictionsData?.forEach((r: any) => {
        restrictionsMap[r.user_id] = r;
      });
      setRestrictions(restrictionsMap);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load user controls');
    } finally {
      setLoading(false);
    }
  };

  const updateRestriction = async (userId: string, field: keyof Omit<UserRestriction, 'user_id'>, value: boolean) => {
    try {
      const existingRestriction = restrictions[userId];

      if (existingRestriction) {
        // Update existing
        const { error } = await supabase
          .from('user_restrictions')
          .update({ [field]: value })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('user_restrictions')
          .insert({
            user_id: userId,
            [field]: value
          });

        if (error) throw error;
      }

      toast.success('User controls updated');
      loadData();
    } catch (error: any) {
      console.error('Error updating restriction:', error);
      toast.error('Failed to update user controls');
    }
  };

  const banUserFromEverything = async (userId: string) => {
    try {
      const allDisabled = {
        user_id: userId,
        banned_from_public_chat: true,
        banned_from_direct_messages: true,
        banned_from_groups: true,
        image_generation_disabled: true,
        video_generation_disabled: true,
        math_solver_disabled: true,
        live_video_call_disabled: true,
        minecraft_plugin_disabled: true,
        voice_chat_disabled: true,
        ai_chat_disabled: true
      };

      const existingRestriction = restrictions[userId];

      if (existingRestriction) {
        const { error } = await supabase
          .from('user_restrictions')
          .update(allDisabled)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_restrictions')
          .insert(allDisabled);

        if (error) throw error;
      }

      toast.success('User banned from all features');
      loadData();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const unbanUserFromEverything = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_restrictions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('All restrictions removed');
      loadData();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to remove restrictions');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const selectedProfile = profiles.find(p => p.id === selectedUser);
  const userRestrictions = selectedUser ? restrictions[selectedUser] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose a user to manage their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {profiles.map((profile) => {
                const hasRestrictions = restrictions[profile.id];
                const restrictionCount = hasRestrictions
                  ? Object.values(restrictions[profile.id]).filter(v => v === true).length
                  : 0;

                return (
                  <button
                    key={profile.id}
                    onClick={() => setSelectedUser(profile.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedUser === profile.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-accent border-border'
                    }`}
                  >
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-sm text-muted-foreground">{profile.email}</div>
                    {restrictionCount > 0 && (
                      <div className="text-xs text-destructive mt-1">
                        {restrictionCount} restriction{restrictionCount !== 1 ? 's' : ''} active
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>User Controls</CardTitle>
          <CardDescription>
            {selectedProfile
              ? `Managing permissions for ${selectedProfile.name}`
              : 'Select a user to manage their permissions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProfile ? (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-2 pb-4 border-b">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => banUserFromEverything(selectedProfile.id)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Ban from Everything
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unbanUserFromEverything(selectedProfile.id)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Remove All Restrictions
                </Button>
              </div>

              {/* Individual Controls */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-4">
                  {/* Communication Features */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Communication</h3>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="public-chat">Public Chat</Label>
                          <p className="text-xs text-muted-foreground">Access to public chat room</p>
                        </div>
                      </div>
                      <Switch
                        id="public-chat"
                        checked={!userRestrictions?.banned_from_public_chat}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'banned_from_public_chat', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="dm">Direct Messages</Label>
                          <p className="text-xs text-muted-foreground">Send and receive DMs</p>
                        </div>
                      </div>
                      <Switch
                        id="dm"
                        checked={!userRestrictions?.banned_from_direct_messages}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'banned_from_direct_messages', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="groups">Groups</Label>
                          <p className="text-xs text-muted-foreground">Create and join groups</p>
                        </div>
                      </div>
                      <Switch
                        id="groups"
                        checked={!userRestrictions?.banned_from_groups}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'banned_from_groups', !checked)
                        }
                      />
                    </div>
                  </div>

                  {/* AI Features */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">AI Features</h3>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="ai-chat">AI Chat</Label>
                          <p className="text-xs text-muted-foreground">Chat with AI models</p>
                        </div>
                      </div>
                      <Switch
                        id="ai-chat"
                        checked={!userRestrictions?.ai_chat_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'ai_chat_disabled', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="image-gen">Image Generation</Label>
                          <p className="text-xs text-muted-foreground">Generate images with AI</p>
                        </div>
                      </div>
                      <Switch
                        id="image-gen"
                        checked={!userRestrictions?.image_generation_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'image_generation_disabled', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="video-gen">Video Generation</Label>
                          <p className="text-xs text-muted-foreground">Generate videos with AI</p>
                        </div>
                      </div>
                      <Switch
                        id="video-gen"
                        checked={!userRestrictions?.video_generation_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'video_generation_disabled', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calculator className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="math-solver">Math Solver</Label>
                          <p className="text-xs text-muted-foreground">Solve math problems</p>
                        </div>
                      </div>
                      <Switch
                        id="math-solver"
                        checked={!userRestrictions?.math_solver_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'math_solver_disabled', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="minecraft">Minecraft Plugin Maker</Label>
                          <p className="text-xs text-muted-foreground">Create Minecraft plugins</p>
                        </div>
                      </div>
                      <Switch
                        id="minecraft"
                        checked={!userRestrictions?.minecraft_plugin_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'minecraft_plugin_disabled', !checked)
                        }
                      />
                    </div>
                  </div>

                  {/* Call Features */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground">Call Features</h3>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Camera className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="live-video">Live Video Call</Label>
                          <p className="text-xs text-muted-foreground">AI vision camera feed</p>
                        </div>
                      </div>
                      <Switch
                        id="live-video"
                        checked={!userRestrictions?.live_video_call_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'live_video_call_disabled', !checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mic className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <Label htmlFor="voice-chat">Voice Chat</Label>
                          <p className="text-xs text-muted-foreground">Voice conversations with AI</p>
                        </div>
                      </div>
                      <Switch
                        id="voice-chat"
                        checked={!userRestrictions?.voice_chat_disabled}
                        onCheckedChange={(checked) =>
                          updateRestriction(selectedProfile.id, 'voice_chat_disabled', !checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a user from the list to manage their permissions
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
