import { MultiplayerShooter } from '@/components/MultiplayerShooter';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Game = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

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
