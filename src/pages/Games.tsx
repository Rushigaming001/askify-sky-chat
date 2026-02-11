import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Gamepad2, Crown, Dice1, Crosshair, Pencil } from 'lucide-react';

const games = [
  { title: 'Chess', description: '2-player online chess', icon: Crown, path: '/chess', gradient: 'from-amber-600 to-yellow-500' },
  { title: 'Ludo', description: '4-player online Ludo', icon: Dice1, path: '/ludo', gradient: 'from-emerald-500 to-green-500' },
  { title: 'Skribbl', description: 'Draw & guess with friends', icon: Pencil, path: '/skribbl', gradient: 'from-pink-500 to-rose-500' },
  { title: 'FPS Shooter', description: 'Multiplayer shooter game', icon: Crosshair, path: '/game', gradient: 'from-red-600 to-orange-500' },
];

const Games = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !session?.user) navigate('/auth', { replace: true });
  }, [isLoading, session?.user, navigate]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Gamepad2 className="h-7 w-7 text-violet-400" />
          <h1 className="text-3xl font-bold text-white">Games</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {games.map((game) => (
            <Card
              key={game.path}
              className="group cursor-pointer bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
              onClick={() => navigate(game.path)}
            >
              <CardContent className="p-6 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
                <div className="relative z-10 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <game.icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-200 transition-colors">{game.title}</h3>
                    <p className="text-white/50 text-sm">{game.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Games;
