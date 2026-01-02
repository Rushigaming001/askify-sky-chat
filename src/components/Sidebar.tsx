import { useState, useEffect } from 'react';
import { Plus, MessageSquare, MoreVertical, Edit2, Trash2, Share2, Menu, Settings, LogOut, User, Download, Mail, Pin, Shield, Users as UsersIcon, MessageCircle, Sparkles, Gamepad2, Pencil, Wind, BarChart3, Play, BookOpen, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { chats, currentChat, createNewChat, selectChat, deleteChat, renameChat, togglePinChat } = useChat();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isInstallable, installPWA, isInstalled } = usePWAInstall();
  const [renameDialog, setRenameDialog] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
    fetchUserRole();
  }, [user]);

  const checkAdminStatus = async () => {
    const userId = user?.id;
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_owner_or_admin', {
        _user_id: userId,
      });

      if (error) throw error;
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchUserRole = async () => {
    const userId = user?.id;
    if (!userId) {
      setUserRole(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setUserRole(data?.role || null);
    } catch {
      setUserRole(null);
    }
  };

  const isPaidRole = (role: string | null) => {
    const paidRoles = ['plus', 'pro', 'elite', 'silver', 'gold', 'platinum', 'basic', 'premium', 'vip'];
    return role && paidRoles.includes(role);
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      plus: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      pro: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30',
      elite: 'bg-violet-500/20 text-violet-600 border-violet-500/30',
      silver: 'bg-slate-400/20 text-slate-600 border-slate-400/30',
      gold: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
      platinum: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
      basic: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
      premium: 'bg-pink-500/20 text-pink-600 border-pink-500/30',
      vip: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      owner: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      admin: 'bg-red-500/20 text-red-600 border-red-500/30',
      moderator: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
      ceo: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
      founder: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      co_founder: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
      friend: 'bg-pink-500/20 text-pink-600 border-pink-500/30',
    };
    return colors[role] || 'bg-green-500/20 text-green-600 border-green-500/30';
  };

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
      <div className="fixed top-4 left-4 z-50 animate-fade-in">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onToggle} 
          className="bg-background/80 backdrop-blur hover:bg-background hover:scale-110 transition-all duration-200 shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in" 
        onClick={onToggle} 
      />
      <aside className="fixed left-0 top-0 h-full w-64 md:w-72 bg-background border-r border-border z-50 flex flex-col shadow-2xl animate-slide-in-left">
        <div className="p-4 border-b border-border flex items-center justify-between backdrop-blur">
          <div className="flex items-center gap-2 animate-scale-in">
            <img src={logo} alt="Askify" className="h-8 w-8 transition-transform hover:scale-110 duration-200" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Askify
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className="hover:bg-accent hover:rotate-90 transition-all duration-300"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          <Button 
            onClick={createNewChat} 
            className="w-full hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg" 
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chat History
          </div>
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
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-all duration-200 hover:scale-[1.02] hover:shadow-sm ${
                  currentChat?.id === chat.id ? 'bg-accent shadow-sm' : ''
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
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
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

        <div className="border-t border-border p-2 space-y-1 animate-fade-in">
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
            size="sm"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="h-4 w-4 mr-2" />
            Pricing / Upgrade
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
            size="sm"
            onClick={() => navigate('/public-chat')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Public Chat
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
            size="sm"
            onClick={async () => {
              const result = await installPWA();
              if (result === 'already-installed') {
                toast({
                  title: 'Already Installed',
                  description: 'Askify app is already installed on your device!'
                });
              } else if (result === true) {
                toast({
                  title: 'Success!',
                  description: 'Askify app has been installed successfully!'
                });
              } else if (result === false) {
                toast({
                  title: 'Installation Cancelled',
                  description: 'You cancelled the installation.'
                });
              } else {
                const apkUrl = 'https://your-server.com/askify.apk';
                const link = document.createElement('a');
                link.href = apkUrl;
                link.download = 'Askify.apk';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast({
                  title: 'Download Started',
                  description: 'APK download will begin shortly. Install it to use Askify as a native app!',
                  duration: 5000
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Mobile App
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
            size="sm"
            onClick={() => window.location.href = 'mailto:opgamer012321@gmail.com'}
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Button>

          {isAdmin && (
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-accent transition-all duration-200 hover:scale-[1.02]" 
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
          
          <div className="flex items-center gap-2 p-2 border-t border-border animate-fade-in">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-transform hover:scale-110 duration-200">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                {userRole && (
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getRoleBadgeColor(userRole)}`}>
                    {userRole === 'co_founder' ? 'CO-FOUNDER' : userRole.toUpperCase()}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
