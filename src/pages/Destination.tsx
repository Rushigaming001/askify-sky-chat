import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Image, Globe, BookOpen, Sparkles, Video, BarChart3, Gamepad2 } from 'lucide-react';
import askifyLogoNew from '@/assets/askify-logo-new.png';

const destinations = [
  {
    title: 'AI Chat',
    description: 'Chat with advanced AI models',
    icon: MessageSquare,
    path: '/chat',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'shadow-blue-500/30'
  },
  {
    title: 'AI Features',
    description: 'Image generation & more',
    icon: Sparkles,
    path: '/ai-features',
    gradient: 'from-purple-500 to-pink-500',
    shadowColor: 'shadow-purple-500/30'
  },
  {
    title: 'Public Chat',
    description: 'Chat with the community',
    icon: Globe,
    path: '/public-chat',
    gradient: 'from-green-500 to-emerald-500',
    shadowColor: 'shadow-green-500/30'
  },
  {
    title: 'Learn Languages',
    description: 'AI-powered language learning',
    icon: BookOpen,
    path: '/learn',
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'shadow-orange-500/30'
  },
  {
    title: 'Data Analyzer',
    description: 'Analyze your data with AI',
    icon: BarChart3,
    path: '/data-analyzer',
    gradient: 'from-cyan-500 to-teal-500',
    shadowColor: 'shadow-cyan-500/30'
  },
  {
    title: 'Games',
    description: 'Skribbl, FPS Shooter & more',
    icon: Gamepad2,
    path: '/skribbl',
    gradient: 'from-red-500 to-rose-500',
    shadowColor: 'shadow-red-500/30'
  }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={askifyLogoNew} 
              alt="Askify" 
              className="h-16 w-16 animate-float"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
            Welcome to ASKIFY
          </h1>
          <p className="text-lg text-white/60">
            Where would you like to go?
          </p>
        </div>

        {/* Destination Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl w-full animate-scale-in">
          {destinations.map((dest, index) => (
            <Card
              key={dest.path}
              className={`group cursor-pointer bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${dest.shadowColor} overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(dest.path)}
            >
              <CardContent className="p-6 relative">
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${dest.gradient} flex items-center justify-center mb-4 shadow-lg ${dest.shadowColor} group-hover:scale-110 transition-transform duration-300`}>
                    <dest.icon className="h-7 w-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">
                    {dest.title}
                  </h3>
                  <p className="text-white/50 text-sm group-hover:text-white/70 transition-colors">
                    {dest.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick action button */}
        <Button
          onClick={() => navigate('/settings')}
          variant="ghost"
          className="mt-8 text-white/40 hover:text-white hover:bg-white/10"
        >
          Go to Settings
        </Button>
      </div>
    </div>
  );
};

export default Destination;
