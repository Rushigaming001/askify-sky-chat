import { MultiplayerShooter } from '@/components/MultiplayerShooter';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
    <div className="w-full h-screen overflow-hidden">
      <MultiplayerShooter />
    </div>
  );
};

export default Game;
