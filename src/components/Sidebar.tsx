import { useState } from 'react';
import { Plus, MessageSquare, MoreVertical, Edit2, Trash2, Share2, Menu, Settings, LogOut, User, Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { chats, currentChat, createNewChat, selectChat, deleteChat, renameChat } = useChat();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [renameDialog, setRenameDialog] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newName, setNewName] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

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

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleUpdateSettings = () => {
    updateUser({ name: newName });
    setSettingsOpen(false);
    toast({ title: 'Settings updated successfully' });
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
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                  currentChat?.id === chat.id ? 'bg-accent' : ''
                }`}
              >
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
            onClick={() => {
              toast({ 
                title: 'Mobile App Coming Soon!', 
                description: 'Download links will be available shortly.' 
              });
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Mobile App
          </Button>
          
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Account Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Name</Label>
                  <Input
                    id="settings-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    value={newEmail}
                    disabled
                    className="opacity-60"
                  />
                </div>
                <Button onClick={handleUpdateSettings} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
