import { useState } from 'react';
import { Plus, MessageSquare, MoreVertical, Edit2, Trash2, Share2, Menu, Settings, LogOut, User, Download, Mail, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { chats, currentChat, createNewChat, selectChat, deleteChat, renameChat, togglePinChat } = useChat();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isInstallable, installPWA } = usePWAInstall();
  const [renameDialog, setRenameDialog] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = (chatId: string) => {
    if (newTitle.trim()) {
      renameChat(chatId, newTitle);
      setRenameDialog(null);
      setNewTitle('');
      toast({ title: 'Chat renamed successfully' });
    }
  };

  const handleDelete = (chatId: string) => {
    deleteChat(chatId);
    toast({ title: 'Chat deleted' });
  };

  const handleShare = () => {
    toast({ title: 'Share feature', description: 'Share link copied to clipboard!' });
  };

  const handlePin = (chatId: string) => {
    togglePinChat(chatId);
    toast({ title: 'Chat pinned status updated' });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={onToggle} className="bg-background/80 backdrop-blur">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={onToggle} />
      <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Askify" className="h-8 w-8" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Askify
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <Button onClick={createNewChat} className="w-full" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {chats
              .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.createdAt - a.createdAt;
              })
              .map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  currentChat?.id === chat.id ? 'bg-accent' : ''
                }`}
              >
                {chat.pinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span
                  className="flex-1 truncate text-sm"
                  onClick={() => selectChat(chat.id)}
                >
                  {chat.title}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Dialog open={renameDialog === chat.id} onOpenChange={(open) => !open && setRenameDialog(null)}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => {
                          e.preventDefault();
                          setRenameDialog(chat.id);
                          setNewTitle(chat.title);
                        }}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Rename Chat</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Enter new title"
                          />
                          <Button onClick={() => handleRename(chat.id)} className="w-full">
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <DropdownMenuItem onSelect={() => handlePin(chat.id)}>
                      <Pin className="h-4 w-4 mr-2" />
                      {chat.pinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDelete(chat.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border p-2 space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="sm"
            onClick={async () => {
              if (isInstallable) {
                const installed = await installPWA();
                if (installed) {
                  toast({ 
                    title: 'App Installed!', 
                    description: 'Askify has been added to your home screen.' 
                  });
                }
              } else {
                toast({ 
                  title: 'Install Askify', 
                  description: 'On mobile: tap Share → Add to Home Screen. On desktop: look for the install icon in your browser.' 
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Mobile App
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => window.location.href = 'mailto:opgamer012321@gmail.com'}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Button>
          
          <div className="flex items-center gap-2 p-2 border-t border-border">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
