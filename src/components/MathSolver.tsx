import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function MathSolver() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setSolution(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!selectedImage) {
      toast({
        title: 'Error',
        description: 'Please select an image first',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('image-ai', {
        body: { 
          action: 'analyze', 
          imageUrl: selectedImage,
          prompt: 'You are a math expert. Analyze this image containing a math problem. Provide a detailed step-by-step solution. Show all work and explain each step clearly. If there are multiple problems, solve all of them.'
        }
      });

      if (error) throw error;

      setSolution(data.analysis);
      toast({
        title: 'Success',
        description: 'Math problem solved!'
      });
    } catch (error) {
      console.error('Error solving math problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to solve the math problem',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline" 
          className="w-full"
          disabled={loading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Scan/Upload Math Problem
        </Button>
      </div>

      {selectedImage && (
        <>
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img 
              src={selectedImage} 
              alt="Math problem" 
              className="w-full h-auto max-h-96 object-contain"
            />
          </div>

          <Button 
            onClick={handleSolve} 
            disabled={loading} 
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Solving...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Solve Math Problem
              </>
            )}
          </Button>
        </>
      )}

      {solution && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold mb-2 text-primary">Solution:</h4>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {solution}
          </div>
        </div>
      )}
    </div>
  );
}
