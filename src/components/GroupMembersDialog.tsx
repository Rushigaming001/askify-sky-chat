import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, UserMinus, Crown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface GroupMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}

export function GroupMembersDialog({ isOpen, onClose, groupId, groupName, isAdmin }: GroupMembersDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      loadMembers();
      if (isAdmin) {
        loadAvailableUsers();
      }
    }
  }, [isOpen, groupId, isAdmin]);

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        id,
        user_id,
        role,
        profiles!group_members_user_id_fkey (
          name,
          email
        )
      `)
      .eq('group_id', groupId);

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

    setMembers(data as GroupMember[]);
  };

  const loadAvailableUsers = async () => {
    if (!user) return;

    // Get all users
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id, name, email');

    if (!allUsers) return;

    // Get current members
    const { data: currentMembers } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    const memberIds = currentMembers?.map(m => m.user_id) || [];
    const available = allUsers.filter(u => !memberIds.includes(u.id));

    setAvailableUsers(available);
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    setIsLoading(true);

    const membersToAdd = selectedUsers.map(userId => ({
      group_id: groupId,
      user_id: userId,
      role: 'member'
    }));

    const { error } = await supabase
      .from('group_members')
      .insert(membersToAdd);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add members',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: `Added ${selectedUsers.length} member(s)`
      });
      setSelectedUsers([]);
      setShowAddMembers(false);
      loadMembers();
      loadAvailableUsers();
    }

    setIsLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Success',
        description: 'Member removed from group'
      });
      loadMembers();
      loadAvailableUsers();
    }

    setRemovingMember(null);
    setIsLoading(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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
    <>
      <Dialog open={isOpen && !showAddMembers} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Group Members - {groupName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin && (
              <Button
                onClick={() => setShowAddMembers(true)}
                className="w-full"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Members
              </Button>
            )}
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {members.map((member) => {
                  const isCurrentUser = member.user_id === user?.id;
                  const canRemove = isAdmin && !isCurrentUser;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(member.profiles.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {member.profiles.name}
                            {isCurrentUser && ' (You)'}
                          </p>
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Shield className="h-3 w-3" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.profiles.email}
                        </p>
                      </div>
                      {canRemove && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setRemovingMember(member.id)}
                          title="Remove member"
                        >
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to {groupName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-96 border rounded-md p-2">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users available to add
                </p>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                      <Checkbox
                        id={`add-user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMembers(false);
                  setSelectedUsers([]);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedUsers.length === 0 || isLoading}
                className="flex-1"
              >
                Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group? They will no longer be able to see group messages or participate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingMember && handleRemoveMember(removingMember)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}