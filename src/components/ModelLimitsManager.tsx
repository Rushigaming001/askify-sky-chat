import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Edit2, Save, X, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface ModelLimit {
  model_id: string;
  daily_limit: number;
  is_expensive: boolean;
}

// Available models with their display names and expense status
const AVAILABLE_MODELS = [
  { id: 'grok', name: 'Grok (Llama 70B)', expensive: false },
  { id: 'gemini', name: 'Gemini Flash', expensive: false },
  { id: 'gemini-lite', name: 'Gemini Flash Lite', expensive: false },
  { id: 'askify', name: 'Gemini Pro (Askify)', expensive: true },
  { id: 'gemini-3', name: 'Gemini 3 Pro', expensive: true },
  { id: 'gemini-3-flash', name: 'Gemini 3 Flash', expensive: false },
  { id: 'gpt', name: 'GPT-5', expensive: true },
  { id: 'gpt-mini', name: 'GPT-5 Mini', expensive: false },
  { id: 'gpt-nano', name: 'GPT-5 Nano', expensive: false },
  { id: 'gpt-5.2', name: 'GPT-5.2', expensive: true },
  { id: 'claude-haiku', name: 'Claude Haiku', expensive: false },
  { id: 'claude-sonnet', name: 'Claude Sonnet', expensive: true },
  { id: 'claude-opus', name: 'Claude Opus', expensive: true },
  { id: 'deepseek', name: 'DeepSeek', expensive: false },
  { id: 'deepseek-v3', name: 'DeepSeek V3', expensive: false },
  { id: 'cohere', name: 'Cohere Command', expensive: false },
  { id: 'qwen-coder', name: 'Qwen Coder', expensive: false },
  { id: 'mistral-small', name: 'Mistral Small', expensive: false },
  { id: 'perplexity-sonar', name: 'Perplexity Sonar', expensive: true },
  { id: 'perplexity-reasoning', name: 'Perplexity Reasoning', expensive: true },
  { id: 'kimi-k2', name: 'Kimi K2 Thinking', expensive: true },
];

// Default limits per model type
const DEFAULT_LIMITS: Record<string, number> = {
  // Free/cheap models
  'grok': 50,
  'gemini': 40,
  'gemini-lite': 100,
  'gemini-3-flash': 30,
  'gpt-mini': 30,
  'gpt-nano': 50,
  'claude-haiku': 30,
  'deepseek': 50,
  'deepseek-v3': 40,
  'cohere': 40,
  'qwen-coder': 40,
  'mistral-small': 40,
  // Expensive models
  'askify': 10,
  'gemini-3': 5,
  'gpt': 5,
  'gpt-5.2': 5,
  'claude-sonnet': 10,
  'claude-opus': 3,
  'perplexity-sonar': 10,
  'perplexity-reasoning': 5,
  'kimi-k2': 5,
};

export default function ModelLimitsManager() {
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      // Try to load from localStorage first (simple implementation)
      const savedLimits = localStorage.getItem('model_daily_limits');
      if (savedLimits) {
        setLimits(JSON.parse(savedLimits));
      } else {
        // Use default limits
        setLimits(DEFAULT_LIMITS);
      }
    } catch (error) {
      console.error('Error loading limits:', error);
      setLimits(DEFAULT_LIMITS);
    } finally {
      setLoading(false);
    }
  };

  const handleEditLimit = (modelId: string, currentLimit: number) => {
    setEditingModel(modelId);
    setEditLimit(currentLimit.toString());
  };

  const handleSaveLimit = async (modelId: string) => {
    const newLimit = parseInt(editLimit);
    
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setSaving(true);
    try {
      const updatedLimits = { ...limits, [modelId]: newLimit };
      setLimits(updatedLimits);
      
      // Save to localStorage (can be extended to save to database)
      localStorage.setItem('model_daily_limits', JSON.stringify(updatedLimits));
      
      toast.success(`Limit for ${AVAILABLE_MODELS.find(m => m.id === modelId)?.name} updated to ${newLimit}/day`);
      setEditingModel(null);
    } catch (error) {
      console.error('Error saving limit:', error);
      toast.error('Failed to update limit');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingModel(null);
    setEditLimit('');
  };

  const getLimit = (modelId: string) => {
    return limits[modelId] ?? DEFAULT_LIMITS[modelId] ?? 20;
  };

  if (loading) {
    return <div className="text-center py-8">Loading model limits...</div>;
  }

  const expensiveModels = AVAILABLE_MODELS.filter(m => m.expensive);
  const freeModels = AVAILABLE_MODELS.filter(m => !m.expensive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Per-Model Daily Limits
        </CardTitle>
        <CardDescription>
          Set different daily message limits for each AI model. Expensive models have lower default limits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {/* Expensive Models Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-amber-500">Expensive Models (Uses More Credits)</h3>
            </div>
            <div className="space-y-2">
              {expensiveModels.map((model) => {
                const currentLimit = getLimit(model.id);
                const isEditing = editingModel === model.id;

                return (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 border border-amber-500/30 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{model.name}</div>
                      <Badge variant="outline" className="text-amber-500 border-amber-500">
                        💰 Expensive
                      </Badge>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/day</span>
                        <Button
                          size="sm"
                          onClick={() => handleSaveLimit(model.id)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-500">{currentLimit}</span>
                        <span className="text-sm text-muted-foreground">msgs/day</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLimit(model.id, currentLimit)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free/Standard Models Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-green-500" />
              <h3 className="font-semibold text-green-500">Standard Models</h3>
            </div>
            <div className="space-y-2">
              {freeModels.map((model) => {
                const currentLimit = getLimit(model.id);
                const isEditing = editingModel === model.id;

                return (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="font-medium">{model.name}</div>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">/day</span>
                        <Button
                          size="sm"
                          onClick={() => handleSaveLimit(model.id)}
                          disabled={saving}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{currentLimit}</span>
                        <span className="text-sm text-muted-foreground">msgs/day</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditLimit(model.id, currentLimit)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
