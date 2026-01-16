import { AlertTriangle, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ExpensiveModelWarningProps {
  modelName: string;
  onDismiss?: () => void;
}

// List of expensive models
const EXPENSIVE_MODELS = [
  'askify', 'gemini-3', 'gpt', 'gpt-5.2', 'claude-sonnet', 'claude-opus',
  'perplexity-sonar', 'perplexity-reasoning', 'kimi-k2'
];

export function isExpensiveModel(modelId: string): boolean {
  return EXPENSIVE_MODELS.includes(modelId);
}

export function ExpensiveModelWarning({ modelName, onDismiss }: ExpensiveModelWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-b border-amber-500/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="h-4 w-4 animate-pulse" />
              <span className="font-semibold">Premium Model</span>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">
              <span className="font-medium">{modelName}</span> uses more credits per message
            </span>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <span className="hidden sm:inline text-amber-500/80 text-xs">
              ⚡ Consider using a standard model for casual queries
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-amber-500/20"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Model display names for the warning
export function getModelDisplayName(modelId: string): string {
  const names: Record<string, string> = {
    'askify': 'Gemini Pro (Askify)',
    'gemini-3': 'Gemini 3 Pro',
    'gpt': 'GPT-5',
    'gpt-5.2': 'GPT-5.2',
    'claude-sonnet': 'Claude Sonnet',
    'claude-opus': 'Claude Opus',
    'perplexity-sonar': 'Perplexity Sonar',
    'perplexity-reasoning': 'Perplexity Reasoning',
    'kimi-k2': 'Kimi K2',
    'grok': 'Grok',
    'gemini': 'Gemini Flash',
    'gemini-lite': 'Gemini Flash Lite',
    'gpt-mini': 'GPT-5 Mini',
    'gpt-nano': 'GPT-5 Nano',
    'claude-haiku': 'Claude Haiku',
    'deepseek': 'DeepSeek',
    'deepseek-v3': 'DeepSeek V3',
    'cohere': 'Cohere Command',
  };
  return names[modelId] || modelId;
}
