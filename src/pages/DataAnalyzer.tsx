import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataAnalyzer } from '@/components/DataAnalyzer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DataAnalyzerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="border-b border-border p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <DataAnalyzer />
    </div>
  );
};

export default DataAnalyzerPage;