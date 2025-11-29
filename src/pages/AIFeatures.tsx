import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ImageGenerator } from '@/components/ImageGenerator';
import { ImageAnalyzer } from '@/components/ImageAnalyzer';
import { VoiceChat } from '@/components/VoiceChat';
import DeadshotGame from '@/components/DeadshotGame';

const AIFeatures = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

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
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="generate">Generate Images</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Images</TabsTrigger>
            <TabsTrigger value="voice">Voice Chat</TabsTrigger>
            <TabsTrigger value="game">Deadshot Game</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <ImageGenerator />
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <ImageAnalyzer />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <VoiceChat />
          </TabsContent>

          <TabsContent value="game" className="space-y-4">
            <DeadshotGame />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIFeatures;
