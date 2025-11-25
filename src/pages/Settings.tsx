import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, User, Briefcase, Zap, Mail, Sun, Palette, 
  Settings as SettingsIcon, Mic, Database, Shield, Info, LogOut 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appearance, setAppearance] = useState('System (Default)');
  const [accentColor, setAccentColor] = useState('Default');

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const settingSections = [
    {
      title: 'My Askify',
      items: [
        { icon: User, label: 'Personalization', onClick: () => toast({ title: 'Personalization', description: 'Feature coming soon!' }) },
        { icon: Zap, label: 'Apps & connectors', onClick: () => toast({ title: 'Apps & connectors', description: 'Feature coming soon!' }) },
      ]
    },
    {
      title: 'Account',
      items: [
        { 
          icon: Briefcase, 
          label: 'Workspace', 
          subtitle: 'Personal',
          onClick: () => toast({ title: 'Workspace', description: 'Feature coming soon!' })
        },
        { 
          icon: Mail, 
          label: 'Email', 
          subtitle: user?.email || '',
          onClick: () => toast({ title: 'Email', description: 'Email is managed through your account' })
        },
        { 
          icon: Sun, 
          label: 'Appearance', 
          subtitle: appearance,
          onClick: () => {
            const newAppearance = appearance === 'System (Default)' ? 'Light' : appearance === 'Light' ? 'Dark' : 'System (Default)';
            setAppearance(newAppearance);
            toast({ title: 'Appearance', description: `Changed to ${newAppearance}` });
          }
        },
        { 
          icon: Palette, 
          label: 'Accent color', 
          subtitle: accentColor,
          expandable: true,
          onClick: () => {
            const colors = ['Default', 'Blue', 'Purple', 'Green', 'Orange'];
            const currentIndex = colors.indexOf(accentColor);
            const newColor = colors[(currentIndex + 1) % colors.length];
            setAccentColor(newColor);
            toast({ title: 'Accent color', description: `Changed to ${newColor}` });
          }
        },
      ]
    },
    {
      title: '',
      items: [
        { icon: SettingsIcon, label: 'General', onClick: () => toast({ title: 'General', description: 'Feature coming soon!' }) },
        { icon: Mic, label: 'Voice', onClick: () => navigate('/ai-features') },
        { icon: Database, label: 'Data controls', onClick: () => toast({ title: 'Data controls', description: 'Feature coming soon!' }) },
        { icon: Shield, label: 'Security', onClick: () => toast({ title: 'Security', description: 'Feature coming soon!' }) },
        { icon: Info, label: 'About', onClick: () => toast({ title: 'About Askify', description: 'Made by Mr. Rudra Yenurkar' }) },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col max-w-3xl mx-auto">
        <header className="border-b border-border p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-semibold">Settings</h1>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="flex flex-col items-center py-8">
              <Avatar className="h-24 w-24 mb-4 bg-muted">
                <AvatarFallback className="text-2xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold mb-1">{user?.name || 'User'}</h2>
              <p className="text-muted-foreground mb-4">{user?.email?.split('@')[0] || 'user'}</p>
              <Button variant="outline" className="rounded-full">
                Edit profile
              </Button>
            </div>

            {/* Settings Sections */}
            {settingSections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                {section.title && (
                  <h3 className="text-sm font-medium text-muted-foreground px-4 mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item, itemIdx) => (
                    <button
                      key={itemIdx}
                      onClick={item.onClick}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.label}</div>
                        {item.subtitle && (
                          <div className="text-sm text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      {item.expandable && (
                        <div className="text-muted-foreground">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Logout Button */}
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-destructive/10 transition-colors text-left text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log out</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Settings;
