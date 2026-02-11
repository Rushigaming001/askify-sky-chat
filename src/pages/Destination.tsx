import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Image, Globe, BookOpen, Sparkles, Video, BarChart3, Gamepad2, Settings, Crown, Download, Users } from 'lucide-react';
import askifyLogoNew from '@/assets/askify-logo-new.png';

const destinations = [
  { title: 'AI Chat', description: 'Chat with advanced AI models', icon: MessageSquare, path: '/chat', gradient: 'from-blue-500 to-cyan-500', shadowColor: 'shadow-blue-500/30' },
  { title: 'AI Features', description: 'Image generation & more', icon: Sparkles, path: '/ai-features', gradient: 'from-purple-500 to-pink-500', shadowColor: 'shadow-purple-500/30' },
  { title: 'Public Chat', description: 'Chat with the community', icon: Globe, path: '/public-chat', gradient: 'from-green-500 to-emerald-500', shadowColor: 'shadow-green-500/30' },
  { title: 'Friends Chat', description: 'Chat with your friends', icon: Users, path: '/friends-chat', gradient: 'from-pink-500 to-rose-500', shadowColor: 'shadow-pink-500/30' },
  { title: 'Learn Languages', description: 'AI-powered language learning', icon: BookOpen, path: '/learn', gradient: 'from-orange-500 to-amber-500', shadowColor: 'shadow-orange-500/30' },
  { title: 'Data Analyzer', description: 'Analyze your data with AI', icon: BarChart3, path: '/data-analyzer', gradient: 'from-cyan-500 to-teal-500', shadowColor: 'shadow-cyan-500/30' },
  { title: 'YouTube', description: 'Browse and watch videos', icon: Video, path: '/youtube', gradient: 'from-red-500 to-rose-500', shadowColor: 'shadow-red-500/30' },
  { title: 'Games', description: 'Skribbl, FPS, Chess, Ludo & more', icon: Gamepad2, path: '/games', gradient: 'from-violet-500 to-purple-500', shadowColor: 'shadow-violet-500/30' },
  { title: 'Chess', description: '2-player online chess', icon: Crown, path: '/chess', gradient: 'from-amber-600 to-yellow-500', shadowColor: 'shadow-amber-500/30' },
  { title: 'Ludo', description: '4-player online Ludo', icon: Gamepad2, path: '/ludo', gradient: 'from-emerald-500 to-green-500', shadowColor: 'shadow-emerald-500/30' },
  { title: 'Minecraft', description: 'Download Minecraft APK', icon: Download, path: 'minecraft-download', gradient: 'from-lime-600 to-green-700', shadowColor: 'shadow-green-600/30' },
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={askifyLogoNew} alt="Askify" className="h-16 w-16 animate-float" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
            Welcome to ASKIFY
          </h1>
          <p className="text-lg text-white/60">Where would you like to go?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 max-w-6xl w-full animate-scale-in">
          {destinations.map((dest, index) => (
            <Card
              key={dest.path}
              className={`group cursor-pointer bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${dest.shadowColor} overflow-hidden`}
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => handleClick(dest)}
            >
              <CardContent className="p-5 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${dest.gradient} flex items-center justify-center mb-3 shadow-lg ${dest.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                    <dest.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">{dest.title}</h3>
                  <p className="text-white/50 text-sm group-hover:text-white/70 transition-colors">{dest.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={() => navigate('/settings')} variant="ghost" className="mt-8 text-white/40 hover:text-white hover:bg-white/10">
          <Settings className="h-4 w-4 mr-2" />
          Go to Settings
        </Button>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Destination;
