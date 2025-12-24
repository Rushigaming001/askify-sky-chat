import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Calculator, BookOpen, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const MAHARASHTRA_BOARD_CHAPTERS = {
  algebra: [
    "Sets",
    "Real Numbers", 
    "Polynomials",
    "Linear Equations in Two Variables",
    "Ratio and Proportion",
    "Financial Planning"
  ],
  geometry: [
    "Lines and Angles",
    "Triangles",
    "Quadrilaterals",
    "Circle",
    "Co-ordinate Geometry",
    "Trigonometry",
    "Surface Area and Volume"
  ],
  statistics: [
    "Statistics",
    "Probability"
  ]
};

export function MathSolver() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
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

  const getChapters = () => {
    if (subject === 'algebra') return MAHARASHTRA_BOARD_CHAPTERS.algebra;
    if (subject === 'geometry') return MAHARASHTRA_BOARD_CHAPTERS.geometry;
    if (subject === 'statistics') return MAHARASHTRA_BOARD_CHAPTERS.statistics;
    return [];
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
      const chapterContext = chapter ? `This is from Maharashtra Board Class 9th, ${subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : ''}, Chapter: ${chapter}.` : '';
      
      const { data, error } = await supabase.functions.invoke('image-ai', {
        body: { 
          action: 'analyze', 
          imageUrl: selectedImage,
          prompt: `You are an expert Math teacher following Maharashtra State Board (MSBSHSE) Class 9th curriculum and Shala.com answer format.

${chapterContext}

Analyze this math problem image and provide a detailed solution in the EXACT format used by Shala.com for Maharashtra Board answers:

**📝 प्रश्न (Question):**
[Write the question in both Marathi and English if possible]

**📋 दिलेली माहिती (Given):**
• [List all given information clearly]

**🎯 शोधायचे (To Find):**
• [What needs to be found/proved]

**📐 वापरलेले सूत्र/प्रमेय (Formula/Theorem Used):**
• [State the relevant formulas, theorems, or properties]

**✍️ सोडवणूक (Solution):**

**पायरी 1 (Step 1):**
[First step with clear explanation]

**पायरी 2 (Step 2):**
[Second step with clear explanation]

[Continue with all necessary steps...]

**✅ उत्तर (Answer):**
[Final answer with proper units and box it]

**📌 टीप (Note):**
[Any important points or alternative methods]

Important guidelines:
1. Follow Maharashtra Board textbook patterns exactly
2. Use standard mathematical notation
3. Show all working steps clearly like Shala.com
4. Include diagrams description if needed for geometry problems
5. Mention theorem/property names as given in Maharashtra Board textbook
6. Use both English and Marathi terms where applicable
7. For geometry: mention construction steps separately
8. For algebra: show step-by-step simplification
9. Format should be exam-ready like textbook solutions`
        }
      });

      if (error) throw error;

      setSolution(data.analysis);
      toast({
        title: 'Success!',
        description: 'Math problem solved in Shala.com format!'
      });
    } catch (error) {
      console.error('Error solving math problem:', error);
      toast({
        title: 'Error',
        description: 'Failed to solve the math problem. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Subject & Chapter Selection */}
      <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GraduationCap className="h-4 w-4 text-primary" />
          Maharashtra Board - Class 9th
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Subject</Label>
            <Select value={subject} onValueChange={(val) => { setSubject(val); setChapter(''); }}>
              <SelectTrigger className="h-11 touch-target">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="algebra">Algebra (बीजगणित)</SelectItem>
                <SelectItem value="geometry">Geometry (भूमिती)</SelectItem>
                <SelectItem value="statistics">Statistics (सांख्यिकी)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Chapter</Label>
            <Select value={chapter} onValueChange={setChapter} disabled={!subject}>
              <SelectTrigger className="h-11 touch-target">
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent>
                {getChapters().map((ch) => (
                  <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
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
          className="w-full h-14 text-base gap-3 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all touch-target"
          disabled={loading}
        >
          <Upload className="h-5 w-5" />
          Scan / Upload Math Problem
        </Button>
      </div>

      {selectedImage && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="relative rounded-xl overflow-hidden border border-border shadow-soft">
            <img 
              src={selectedImage} 
              alt="Math problem" 
              className="w-full h-auto max-h-72 object-contain bg-muted/30"
            />
          </div>

          <Button 
            onClick={handleSolve} 
            disabled={loading} 
            className="w-full h-12 text-base gap-2 gradient-primary hover:opacity-90 transition-opacity touch-target"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Solving...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5" />
                Solve (Shala.com Format)
              </>
            )}
          </Button>
        </div>
      )}

      {solution && (
        <div className="animate-fade-in-up p-5 rounded-xl bg-card border border-border shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <BookOpen className="h-5 w-5" />
            Solution (Maharashtra Board Format)
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {solution}
          </div>
        </div>
      )}
    </div>
  );
}