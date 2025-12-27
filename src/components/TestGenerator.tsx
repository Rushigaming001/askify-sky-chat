import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Download, Sparkles, GraduationCap, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Maharashtra Board Class 9 & 10 Curriculum
const CURRICULUM = {
  '9': {
    'Science 1 (Physics/Chemistry)': [
      'Laws of Motion', 'Work and Energy', 'Sound', 'Current Electricity',
      'Magnetism', 'Measurement of Matter', 'Acids, Bases and Salts',
      'Metals and Non-metals', 'Carbon Compounds', 'Radiation'
    ],
    'Science 2 (Biology)': [
      'Living World and Classification', 'Useful and Harmful Microbes',
      'Life Processes in Living Organisms', 'Cell Division', 'Heredity and Evolution',
      'Environmental Management', 'Introduction to Biotechnology', 'Health and Diseases'
    ],
    'Maths 1 (Algebra)': [
      'Sets', 'Real Numbers', 'Polynomials', 'Ratio and Proportion',
      'Linear Equations in Two Variables', 'Financial Planning', 'Statistics', 'Probability'
    ],
    'Maths 2 (Geometry)': [
      'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Circle',
      'Co-ordinate Geometry', 'Trigonometry', 'Mensuration', 'Geometric Constructions'
    ],
    'English': [
      'Prose - Unit 1', 'Prose - Unit 2', 'Prose - Unit 3', 'Prose - Unit 4',
      'Poetry - Unit 1', 'Poetry - Unit 2', 'Poetry - Unit 3',
      'Writing Skills', 'Grammar'
    ],
    'Hindi': [
      'गद्य खंड', 'पद्य खंड', 'व्याकरण', 'लेखन कौशल', 'पत्र लेखन', 'निबंध'
    ],
    'Sanskrit': [
      'सुभाषितानि', 'कथा', 'पत्रम्', 'व्याकरणम्', 'अपठित अवबोधनम्', 'निबंधः'
    ],
    'Marathi': [
      'गद्य', 'पद्य', 'व्याकरण', 'उपयोजित लेखन', 'भाषाभ्यास', 'अपठित गद्य'
    ],
    'History': [
      'Historiography', 'Sources of History', 'India and Europeans',
      'British Territorial Expansion', 'Social and Religious Reforms',
      'First War of Independence 1857', 'India\'s Freedom Struggle'
    ],
    'Geography': [
      'Location and Extent', 'Physical Features', 'Climate', 'Natural Vegetation and Wildlife',
      'Population', 'Agriculture', 'Industries', 'Transport and Communication'
    ]
  },
  '10': {
    'Science 1 (Physics/Chemistry)': [
      'Gravitation', 'Periodic Classification', 'Chemical Reactions', 'Effects of Electric Current',
      'Heat', 'Refraction of Light', 'Lenses', 'Carbon Compounds', 'Metallurgy', 'Space Missions'
    ],
    'Science 2 (Biology)': [
      'Life Processes - Nutrition', 'Life Processes - Respiration', 'Life Processes - Excretion',
      'Control and Coordination', 'Reproduction', 'Heredity and Evolution',
      'Life Processes in Plants', 'Environmental Management', 'Social Health'
    ],
    'Maths 1 (Algebra)': [
      'Quadratic Equations', 'Arithmetic Progression', 'Financial Planning',
      'Probability', 'Statistics', 'Linear Equations in Two Variables'
    ],
    'Maths 2 (Geometry)': [
      'Similarity', 'Pythagoras Theorem', 'Circle', 'Geometric Constructions',
      'Co-ordinate Geometry', 'Trigonometry', 'Mensuration'
    ],
    'English': [
      'Prose Lessons', 'Poetry', 'Writing Skills', 'Grammar', 'Reading Comprehension',
      'Rapid Reading', 'Vocabulary', 'Figures of Speech'
    ],
    'Hindi': [
      'गद्य खंड', 'पद्य खंड', 'व्याकरण', 'लेखन कौशल', 'पत्र लेखन', 'निबंध'
    ],
    'Sanskrit': [
      'सुभाषितानि', 'कथा', 'पत्रम्', 'व्याकरणम्', 'अपठित अवबोधनम्', 'निबंधः'
    ],
    'Marathi': [
      'गद्य', 'पद्य', 'व्याकरण', 'उपयोजित लेखन', 'भाषाभ्यास', 'अपठित गद्य'
    ],
    'History': [
      'Historiography', 'Development of Nationalism', 'World War I and II',
      'India\'s Freedom Struggle (1885-1947)', 'Post-Independence India', 'Cultural Heritage'
    ],
    'Geography': [
      'Field Visit', 'Location and Extent', 'Climate', 'Soil Types',
      'Natural Vegetation', 'Water Resources', 'Human Resources', 'Economy'
    ]
  }
};

const MARKS_OPTIONS = ['5', '10', '15', '20', '25', '30', '40', '50', '80', '100'];

export function TestGenerator() {
  const [classLevel, setClassLevel] = useState<'9' | '10'>('9');
  const [subject, setSubject] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [totalMarks, setTotalMarks] = useState<string>('25');
  const [testTitle, setTestTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<string | null>(null);
  const { toast } = useToast();

  const subjects = Object.keys(CURRICULUM[classLevel]);
  const chapters = subject ? CURRICULUM[classLevel][subject as keyof typeof CURRICULUM['9']] || [] : [];

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const selectAllChapters = () => {
    setSelectedChapters(chapters.length === selectedChapters.length ? [] : [...chapters]);
  };

  const generateTest = async () => {
    if (!subject || selectedChapters.length === 0) {
      toast({ title: 'Error', description: 'Please select subject and at least one chapter', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: 'Error', description: 'Please log in to generate tests', variant: 'destructive' });
        return;
      }

      const prompt = `You are an expert Maharashtra State Board (MSBSHSE) examiner. Generate a complete question paper following the EXACT Maharashtra Board format.

**Test Details:**
- Class: ${classLevel}th Standard
- Subject: ${subject}
- Chapters: ${selectedChapters.join(', ')}
- Total Marks: ${totalMarks}
- Title: ${testTitle || `${subject} Unit Test`}

**Generate a COMPLETE question paper with:**

📝 **QUESTION PAPER FORMAT:**

---
**${testTitle || `Class ${classLevel} - ${subject} Unit Test`}**
**Total Marks: ${totalMarks} | Time: ${parseInt(totalMarks) > 40 ? '2 Hours' : '1 Hour'}**

---

**SECTION A - Very Short Answer Questions (1 mark each)**
[Generate 4-5 questions: MCQ, Fill in blanks, True/False, Match the following]

**SECTION B - Short Answer Questions (2 marks each)**
[Generate 4-5 questions requiring brief explanations]

**SECTION C - Long Answer Questions (3-4 marks each)**
[Generate 3-4 questions requiring detailed answers]

**SECTION D - Very Long Answer Questions (5 marks each)** [if marks > 25]
[Generate 1-2 questions requiring comprehensive answers with diagrams if applicable]

---

**IMPORTANT GUIDELINES:**
1. Follow EXACT Maharashtra Board exam pattern
2. Include questions from ALL selected chapters proportionally
3. Add marking scheme hints in brackets like [2 marks]
4. Include diagram-based questions for Science/Maths
5. For languages: Include comprehension, grammar, writing sections
6. Questions should be clear, exam-ready, and properly numbered
7. Include variety: Objective + Subjective questions
8. For Maths/Science: Include numerical problems and derivations
9. End with "✱✱✱ Best of Luck! ✱✱✱"`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }], 
          model: 'grok',
          mode: 'normal'
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      setGeneratedTest(data.reply);
      toast({ title: 'Test Generated!', description: 'Your question paper is ready for download' });
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate test', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedTest) return;

    // Create a printable HTML document
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testTitle || `Class ${classLevel} - ${subject} Test`}</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.8; max-width: 800px; margin: auto; }
    h1, h2, h3 { color: #1a1a1a; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { background: #f5f5f5; padding: 8px; margin-top: 20px; }
    pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <pre>${generatedTest}</pre>
</body>
</html>`;

    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    toast({ title: 'Print Dialog Opened', description: 'Choose "Save as PDF" to download' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Test Paper Generator</h2>
        </div>
        <p className="text-muted-foreground">Maharashtra Board Class 9 & 10</p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Configure Your Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Class Selection */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={classLevel === '9' ? 'default' : 'outline'}
              onClick={() => { setClassLevel('9'); setSubject(''); setSelectedChapters([]); }}
              className="h-12"
            >
              Class 9th
            </Button>
            <Button
              variant={classLevel === '10' ? 'default' : 'outline'}
              onClick={() => { setClassLevel('10'); setSubject(''); setSelectedChapters([]); }}
              className="h-12"
            >
              Class 10th
            </Button>
          </div>

          {/* Subject Selection */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={(val) => { setSubject(val); setSelectedChapters([]); }}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chapter Selection */}
          {subject && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chapters ({selectedChapters.length} selected)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllChapters}>
                  {chapters.length === selectedChapters.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-lg border p-3">
                <div className="space-y-2">
                  {chapters.map(ch => (
                    <label key={ch} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={selectedChapters.includes(ch)}
                        onCheckedChange={() => toggleChapter(ch)}
                      />
                      <span className="text-sm">{ch}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Marks & Title */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Total Marks</Label>
              <Select value={totalMarks} onValueChange={setTotalMarks}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKS_OPTIONS.map(m => (
                    <SelectItem key={m} value={m}>{m} Marks</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Test Title (optional)</Label>
              <Input
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g. Unit Test 1"
                className="h-12"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateTest}
            disabled={loading || !subject || selectedChapters.length === 0}
            className="w-full h-14 text-lg gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Test Paper...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Question Paper
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Test */}
      {generatedTest && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Question Paper
              </CardTitle>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] rounded-lg border p-4 bg-card">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-serif">
                {generatedTest}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
