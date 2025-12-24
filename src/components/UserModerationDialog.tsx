import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, Ban, UserCheck } from 'lucide-react';

interface UserModerationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentlyBanned?: boolean;
  currentTimeout?: string | null;
}

export function UserModerationDialog({
  isOpen,
  onClose,
  userId,
  userName,
  currentlyBanned = false,
  currentTimeout = null,
}: UserModerationDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutDuration, setTimeoutDuration] = useState('5');

  const isTimedOut = currentTimeout && new Date(currentTimeout) > new Date();

  const handleTimeout = async () => {
    setIsLoading(true);
    try {
      const timeoutMinutes = parseInt(timeoutDuration);
      const timeoutUntil = new Date(Date.now() + timeoutMinutes * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('user_restrictions')
        .upsert({
          user_id: userId,
          public_chat_timeout_until: timeoutUntil,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'User timed out',
        description: `${userName} has been timed out for ${timeoutDuration} minutes`,
      });
      onClose();
    } catch (error) {
      console.error('Error timing out user:', error);
      toast({
        title: 'Error',
        description: 'Failed to timeout user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTimeout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_restrictions')
        .update({ public_chat_timeout_until: null })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Timeout removed',
        description: `${userName}'s timeout has been removed`,
      });
      onClose();
    } catch (error) {
      console.error('Error removing timeout:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove timeout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_restrictions')
        .upsert({
          user_id: userId,
          banned_from_public_chat: true,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast({
        title: 'User banned',
        description: `${userName} has been banned from public chat`,
      });
      onClose();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: 'Error',
        description: 'Failed to ban user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('user_restrictions')
        .update({ 
          banned_from_public_chat: false,
          public_chat_timeout_until: null 
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'User unbanned',
        description: `${userName} has been unbanned from public chat`,
      });
      onClose();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: 'Error',
        description: 'Failed to unban user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Moderate {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Timeout Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeout
            </h4>
            {isTimedOut ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Currently timed out until {new Date(currentTimeout!).toLocaleTimeString()}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveTimeout}
                  disabled={isLoading}
                >
                  Remove Timeout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={timeoutDuration} onValueChange={setTimeoutDuration}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minute</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleTimeout}
                  disabled={isLoading}
                >
                  Apply Timeout
                </Button>
              </div>
            )}
          </div>

          {/* Ban Section */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Ban from Public Chat
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentlyBanned
                ? 'This user is currently banned from public chat.'
                : 'Permanently ban this user from public chat.'}
            </p>
            {currentlyBanned ? (
              <Button
                variant="outline"
                onClick={handleUnban}
                disabled={isLoading}
                className="text-green-600"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Unban User
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleBan}
                disabled={isLoading}
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban User
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
