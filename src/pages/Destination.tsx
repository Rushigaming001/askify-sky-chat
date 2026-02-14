import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Sparkles, Globe, BookOpen, Video, BarChart3, Gamepad2, Settings, Crown, Download, Users, Home, Activity } from 'lucide-react';
import askifyLogoNew from '@/assets/askify-logo-new.png';

const destinations = [
  { title: 'AI Chat', description: 'Chat with advanced AI models', icon: MessageSquare, path: '/chat', color: 'bg-blue-500' },
  { title: 'AI Features', description: 'Image generation & more', icon: Sparkles, path: '/ai-features', color: 'bg-indigo-500' },
  { title: 'Public Chat', description: 'Chat with the community', icon: Globe, path: '/public-chat', color: 'bg-cyan-500' },
  { title: 'Friends Chat', description: 'Chat with your friends', icon: Users, path: '/friends-chat', color: 'bg-sky-500' },
  { title: 'Learn Languages', description: 'AI-powered language learning', icon: BookOpen, path: '/learn', color: 'bg-teal-500' },
  { title: 'Data Analyzer', description: 'Analyze your data with AI', icon: BarChart3, path: '/data-analyzer', color: 'bg-blue-600' },
  { title: 'YouTube', description: 'Browse and watch videos', icon: Video, path: '/youtube', color: 'bg-red-500' },
  { title: 'Games', description: 'Skribbl, FPS, Chess, Ludo & more', icon: Gamepad2, path: '/games', color: 'bg-violet-500' },
  { title: 'Chess', description: '2-player online chess', icon: Crown, path: '/chess', color: 'bg-amber-600' },
  { title: 'Ludo', description: '4-player online Ludo', icon: Gamepad2, path: '/ludo', color: 'bg-emerald-500' },
  { title: 'Service Status', description: 'Check system uptime', icon: Activity, path: '/status', color: 'bg-green-500' },
  { title: 'Minecraft', description: 'Download Minecraft APK', icon: Download, path: 'minecraft-download', color: 'bg-lime-600' },
];

const Destination = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !session?.user) {
      navigate('/auth', { replace: true });
    }
  }, [isLoading, session?.user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleClick = (dest: typeof destinations[0]) => {
    if (dest.path === 'minecraft-download') {
      window.open('https://files.minecrapk.com/minecraft-mod-menu-1.26.10.21.apk', '_blank');
    } else {
      navigate(dest.path);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blue-white gradient background matching auth page */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 animate-gradient-shift" style={{ backgroundSize: '400% 400%' }} />
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-blue-100/30" />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-200/15 rounded-full blur-3xl" />
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-cyan-400/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative animate-float">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 blur-2xl opacity-20 rounded-full" />
              <div className="relative p-3 rounded-2xl bg-white/80 border border-blue-100 shadow-lg backdrop-blur-sm">
                <img src={askifyLogoNew} alt="Askify" className="h-14 w-14 object-contain" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
              Welcome to ASKIFY
            </span>
          </h1>
          <p className="text-lg text-slate-500 font-medium">Where would you like to go?</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 max-w-6xl w-full animate-scale-in">
          {destinations.map((dest, index) => (
            <Card
              key={dest.path}
              className="group cursor-pointer bg-white/80 backdrop-blur-xl border border-blue-100/50 hover:bg-white hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 hover:scale-[1.03] rounded-2xl overflow-hidden"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => handleClick(dest)}
            >
              <CardContent className="p-5">
                <div className={`w-12 h-12 rounded-xl ${dest.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <dest.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{dest.title}</h3>
                <p className="text-slate-500 text-sm">{dest.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 mt-8">
          <Button onClick={() => navigate('/settings')} variant="ghost" className="text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient-shift { animation: gradient-shift 15s ease infinite; }
      `}</style>
    </div>
  );
};

export default Destination;
