import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ImageGenerator } from '@/components/ImageGenerator';
import { ImageAnalyzer } from '@/components/ImageAnalyzer';
import { VoiceChat } from '@/components/VoiceChat';
import { TestGenerator } from '@/components/TestGenerator';

const AIFeatures = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/auth', { replace: true });
  }, [authLoading, user?.id, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto p-4 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ASKIFY AI Features
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs defaultValue="test" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="test">Test Generator</TabsTrigger>
            <TabsTrigger value="generate">Generate Images</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Images</TabsTrigger>
            <TabsTrigger value="voice">Voice Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="test" className="space-y-4">
            <TestGenerator />
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <ImageGenerator />
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <ImageAnalyzer />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <VoiceChat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIFeatures;
