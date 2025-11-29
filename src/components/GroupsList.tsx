import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_admin?: boolean;
}

interface GroupsListProps {
  onOpenGroupChat: (groupId: string, groupName: string) => void;
}

export function GroupsList({ onOpenGroupChat }: GroupsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);

  useEffect(() => {
    if (!user) return;
    loadGroups();
    loadAllUsers();

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups'
        },
        () => {
          loadGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadAllUsers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .neq('id', user.id);
    
    setAllUsers(data || []);
  };

  const loadGroups = async () => {
    if (!user) return;
    
    const { data: groupsData, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members(count, role, user_id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading groups:', error);
      return;
    }

    const groupsWithCount = groupsData?.map(g => {
      const members = Array.isArray(g.group_members) ? g.group_members : [g.group_members];
      const userMember = members.find((m: any) => m.user_id === user.id);
      return {
        ...g,
        member_count: g.group_members?.[0]?.count || 0,
        is_admin: g.created_by === user.id || userMember?.role === 'admin'
      };
    }) || [];

    setGroups(groupsWithCount);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    setIsCreating(true);
    
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        created_by: user.id
      })
      .select()
      .single();

    if (groupError) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive'
      });
      setIsCreating(false);
      return;
    }

    // Add creator as admin member
    const membersToAdd = [
      { group_id: group.id, user_id: user.id, role: 'admin' },
      ...selectedMembers.map(userId => ({ 
        group_id: group.id, 
        user_id: userId, 
        role: 'member' 
      }))
    ];

    const { error: memberError } = await supabase
      .from('group_members')
      .insert(membersToAdd);

    if (memberError) {
      console.error('Error adding members to group:', memberError);
      toast({
        title: 'Warning',
        description: 'Group created but some members could not be added',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Group created successfully'
      });
    }

    setShowCreateDialog(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedMembers([]);
    setIsCreating(false);
    loadGroups();
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete || !user) return;

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupToDelete.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Group deleted successfully'
    });

    setGroupToDelete(null);
    loadGroups();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Groups</h3>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No groups yet</p>
              <p className="text-xs text-muted-foreground">Create one to get started</p>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{group.name}</h4>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {group.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenGroupChat(group.id, group.name)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  {group.is_admin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setGroupToDelete(group)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Group Name</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name..."
                maxLength={50}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description (optional)</label>
              <Textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                maxLength={200}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Add Members (optional)</label>
              <ScrollArea className="h-48 border rounded-md p-2">
                {allUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No users available</p>
                ) : (
                  <div className="space-y-2">
                    {allUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedMembers.includes(user.id)}
                          onCheckedChange={() => toggleMember(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!groupToDelete} onOpenChange={() => setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{groupToDelete?.name}"? This action cannot be undone.
              All messages and members will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
