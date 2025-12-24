import { MultiplayerShooter } from '@/components/MultiplayerShooter';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Game = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/auth', { replace: true });
  }, [authLoading, user?.id, navigate]);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full h-screen overflow-hidden relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <MultiplayerShooter />
    </div>
  );
};

export default Game;
