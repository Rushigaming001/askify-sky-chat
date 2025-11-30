import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Wand2, Type, Music, Sparkles, Palette, Zap, 
  Video, MessageSquare, Layers, Filter, Wind, Star 
} from 'lucide-react';
import { toast } from 'sonner';

interface Effect {
  id: string;
  name: string;
  icon: any;
  category: string;
}

const effects: Effect[] = [
  { id: 'blur', name: 'Blur', icon: Wind, category: 'basic' },
  { id: 'brightness', name: 'Brightness', icon: Sparkles, category: 'basic' },
  { id: 'contrast', name: 'Contrast', icon: Palette, category: 'basic' },
  { id: 'saturation', name: 'Saturation', icon: Palette, category: 'basic' },
  { id: 'vintage', name: 'Vintage', icon: Filter, category: 'filters' },
  { id: 'cinematic', name: 'Cinematic', icon: Video, category: 'filters' },
  { id: 'bw', name: 'Black & White', icon: Filter, category: 'filters' },
  { id: 'sepia', name: 'Sepia', icon: Filter, category: 'filters' },
  { id: 'glow', name: 'Glow', icon: Star, category: 'effects' },
  { id: 'glitch', name: 'Glitch', icon: Zap, category: 'effects' },
  { id: 'vignette', name: 'Vignette', icon: Layers, category: 'effects' },
];

const transitions = [
  { id: 'fade', name: 'Fade' },
  { id: 'dissolve', name: 'Dissolve' },
  { id: 'wipe', name: 'Wipe' },
  { id: 'slide', name: 'Slide' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'spin', name: 'Spin' },
];

export const EffectsPanel = () => {
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [effectIntensity, setEffectIntensity] = useState(50);

  const handleApplyEffect = (effectId: string) => {
    setSelectedEffect(effectId);
    toast.success(`${effectId} effect applied`);
  };

  const handleApplyTransition = (transitionId: string) => {
    toast.success(`${transitionId} transition added`);
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Effects & Filters</h3>
      </div>

      <Tabs defaultValue="effects" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="effects">Effects</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="effects" className="mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {effects.filter(e => e.category === 'basic' || e.category === 'effects').map((effect) => {
                  const Icon = effect.icon;
                  return (
                    <Button
                      key={effect.id}
                      variant={selectedEffect === effect.id ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => handleApplyEffect(effect.id)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  );
                })}
              </div>

              {selectedEffect && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Label>Effect Intensity</Label>
                  <Slider
                    value={[effectIntensity]}
                    onValueChange={([value]) => setEffectIntensity(value)}
                    max={100}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{effectIntensity}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="filters" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {effects.filter(e => e.category === 'filters').map((filter) => {
                const Icon = filter.icon;
                return (
                  <Button
                    key={filter.id}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                    onClick={() => handleApplyEffect(filter.id)}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{filter.name}</span>
                  </Button>
                );
              })}
            </div>

            <div className="mt-6 space-y-4">
              <h4 className="text-sm font-semibold">Color Grading</h4>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Exposure</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div>
                  <Label className="text-xs">Contrast</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div>
                  <Label className="text-xs">Saturation</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div>
                  <Label className="text-xs">Temperature</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transitions" className="mt-0">
            <div className="grid grid-cols-2 gap-2">
              {transitions.map((transition) => (
                <Button
                  key={transition.id}
                  variant="outline"
                  className="h-16"
                  onClick={() => handleApplyTransition(transition.id)}
                >
                  {transition.name}
                </Button>
              ))}
            </div>

            <div className="mt-6 space-y-3 p-4 border rounded-lg">
              <Label>Transition Duration</Label>
              <Slider defaultValue={[1000]} min={100} max={3000} step={100} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1s</span>
                <span>3s</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-0 space-y-4">
            <Button className="w-full" onClick={() => toast.success('Text layer added')}>
              <Type className="h-4 w-4 mr-2" />
              Add Text
            </Button>

            <div className="space-y-3 p-4 border rounded-lg">
              <div>
                <Label>Text Content</Label>
                <Input placeholder="Enter text..." />
              </div>
              <div>
                <Label>Font Size</Label>
                <Slider defaultValue={[24]} min={12} max={72} step={1} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Bold</Button>
                <Button variant="outline" size="sm">Italic</Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Text Animations</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Fade In</Button>
                <Button variant="outline" size="sm">Slide In</Button>
                <Button variant="outline" size="sm">Typewriter</Button>
                <Button variant="outline" size="sm">Bounce</Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
