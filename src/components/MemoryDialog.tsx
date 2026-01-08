import { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Memory {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function MemoryDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemory, setNewMemory] = useState('');
  const [addingMemory, setAddingMemory] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      fetchMemories();
    }
  }, [open, user?.id]);

  const fetchMemories = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_memories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async () => {
    if (!user?.id || !newMemory.trim()) return;
    setAddingMemory(true);
    try {
      const { error } = await supabase
        .from('user_memories')
        .insert({ user_id: user.id, content: newMemory.trim() });
      
      if (error) throw error;
      toast({ title: 'Memory saved!' });
      setNewMemory('');
      fetchMemories();
    } catch (error) {
      console.error('Error adding memory:', error);
      toast({ title: 'Failed to save memory', variant: 'destructive' });
    } finally {
      setAddingMemory(false);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_memories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Memory deleted' });
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({ title: 'Failed to delete memory', variant: 'destructive' });
    }
  };

  const filteredMemories = memories.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usedPercentage = Math.min((memories.length / 50) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Memory</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Saved memories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Usage indicator */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
            <div className="text-amber-600 dark:text-amber-400 font-medium text-sm mb-1">
              {usedPercentage.toFixed(0)}% full
            </div>
            <div className="w-full h-1.5 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300" 
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Once memory is full, responses may feel less personalized. Delete existing memories to add more.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search memories"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add new memory */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a new memory (e.g., 'I prefer concise answers')"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              className="flex-1 min-h-[60px]"
            />
            <Button 
              onClick={addMemory} 
              disabled={!newMemory.trim() || addingMemory}
              size="icon"
              className="h-auto"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Memories list */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading memories...
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Brain className="h-12 w-12 mb-2 opacity-50" />
                <p>{searchQuery ? 'No matching memories' : 'No memories saved yet'}</p>
                <p className="text-xs mt-1">Add memories to personalize your AI experience</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMemories.map((memory) => (
                  <div 
                    key={memory.id}
                    className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <p className="flex-1 text-sm whitespace-pre-wrap">{memory.content}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => deleteMemory(memory.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}