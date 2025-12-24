import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DataAnalyzer } from '@/components/DataAnalyzer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const DataAnalyzerPage = () => {
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