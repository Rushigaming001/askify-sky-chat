import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Download, Sparkles, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Class 9 Complete Curriculum with Units
const CLASS_9_CURRICULUM = {
  'English': {
    'Unit One': ['1.1: Life', '1.2: A Synopsis-The Swiss Family Robinson', '1.3: Have you ever seen...?', '1.4: Have you thought of the verb \'have\'', '1.5: The Necklace'],
    'Unit Two': ['2.1: Invictus', '2.2: A True Story of Sea Turtles', '2.3: Somebody\'s Mother', '2.4: The Fall of Troy', '2.5: Autumn', '2.6: The Past in the Present'],
    'Unit Three': ['3.1: Silver', '3.2: Reading Works of Art', '3.3: The Road Not Taken', '3.4: How the First Letter was Written'],
    'Unit Four': ['4.1: Please Listen!', '4.2: The Storyteller', '4.3: Intellectual Rubbish', '4.4: My Financial Career', '4.5: Tansen'],
    'Grammar & Writing': ['Grammar', 'Writing Skills']
  },
  'Hindi (हिंदी)': {
    'पहली इकाई': ['१: नदी की पुकार', '२: झुमका', '३: निज भाषा', '४: मान जा मेरे मन', '५: किताबें कुछ कहना चाहती हैं', '६: \'इत्यादि\' की आत्मकहानी', '७: छोटा जादुगर', '८: जिंदगी की बड़ी जरुरत है हार...!'],
    'दूसरी इकाई': ['१: गागर में सागर', '२: मैं बरतन माँजूँगा', '३: ग्रामदेवता', '४: साहित्य की निष्कपट विधा है - डायरी', '५: उम्मीद', '६: सागर और मेघ', '७: लघुकथाएँ', '८: झंडा ऊँचा सदा रहेगा', '९: रचना विभाग एवं व्याकरण विभाग']
  },
  'Sanskrit (संस्कृत)': {
    'गद्यात्मकम् (Prose)': ['संस्कृतम्', 'विद्यावन्तः', 'समयः'],
    'पद्यात्मकम् (Poetry)': ['सुभाषिते खरे', 'कालमहत्त्वम्', 'किं कर्तव्यम्? किं न कर्तव्यम्?', 'विद्याधनम्', 'वैराग्यस्य महत्त्वम्', 'नभसि विद्युतः, मनुजाः संस्कृताः'],
    'संवादात्मकम्': ['सूत्रधारा', 'मम स्वदेशः', 'अस्माकं जीवनम्', 'कालस्य महत्त्वम्'],
    'व्याकरणम् (Grammar)': ['कः कदा? किं कुत्र?', 'वाक्य संरचना', 'क्रिया कर्ता च', 'विभक्तयः', 'कालाः (लट्, लङ्, लृट्)', 'उपसर्गाः', 'समासाः', 'सन्धयः', 'शब्दरूपाणि – १', 'शब्दरूपाणि – २', 'धातुरूपाणि'],
    'भाषा-कौशलम्': ['अनुवादः', 'संवादलेखनम्', 'चित्रवर्णनम्', 'पत्रलेखनम्']
  },
  'Marathi (मराठी)': {
    'भाग – १': ['संतवाणीचे संदर्भ', 'संतवाणी – माणसाचा जीवन : संत एकनाथ', 'संतवाणी – संतवाणी शाळा : संत तुकाराम', 'दलितांचे आंबेडकर', 'डॉ. आ. पां. रेगे', 'कालचक्र'],
    'भाग – २': ['ध्यानातले पहाट', 'ओळखीचा वेडाचा गाव', 'विज्ञान यात्रेची दिवस', 'सूत्र आणि', 'हरवलेलं मूल'],
    'भाग – ३': ['उजाड उघडे माळरान', 'छपर', 'आमच्यातल्या पाखराला', 'मुला एकदा', 'होमी'],
    'भाग – ४': ['निष्पन्न', 'जीवनातला आनंद', 'माझी हिरवळ संस्कार', 'स्वतंत्र लेख', 'विज्ञापन', 'उपयोजित लेखन']
  },
  'Math 1 (Algebra)': {
    'All Chapters': ['Sets', 'Real Numbers', 'Polynomials', 'Ratio and Proportion', 'Linear Equations in Two Variables', 'Financial Planning', 'Statistics']
  },
  'Math 2 (Geometry)': {
    'All Chapters': ['Basic Concepts in Geometry', 'Parallel Lines', 'Triangles', 'Constructions of Triangles', 'Quadrilaterals', 'Circle', 'Co-ordinate Geometry', 'Trigonometry', 'Surface Area and Volume']
  },
  'Science 1 (Physics/Chemistry)': {
    'Unit 1': ['1: Laws of Motion', '2: Work and Energy', '3: Current Electricity', '4: Measurement of Matter', '5: Acids, Bases and Salts', '6: Classification of Plants', '7: Energy Flow in an Ecosystem', '8: Useful and Harmful Microbes', '9: Environmental Management', '10: Information Communication Technology (ICT)']
  },
  'Science 2 (Biology)': {
    'Unit 2': ['11: Reflection of Light', '12: Study of Sound', '13: Carbon: An important element', '14: Substances in Common Use', '15: Life Processes in Living Organisms', '16: Heredity and Variation', '17: Introduction to Biotechnology', '18: Observing Space: Telescopes']
  },
  'History & Political Science': {
    'History - India after Independence': ['1: Sources of History', '2: India : Events after 1960', '3: India\'s Internal Challenges', '4: Economic Development', '5: Education', '6: Empowerment of Women and other Weaker Sections', '7: Science and Technology', '8: Industry and Trade', '9: Changing Life: 1', '10: Changing Life: 2'],
    'Political Science - India and World': ['1: Post World War Political Developments', '2: India\'s Foreign Policy', '3: India\'s Defence System', '4: The United Nations', '5: India and Other Countries', '6: International Problems']
  },
  'Geography': {
    'Unit 1': ['1: Distributional Maps', '2: Endogenetic Movements', '3: Exogenetic Movements Part-1', '4: Exogenetic Movements Part-2', '5: Precipitation', '6: Properties of sea water'],
    'Unit 2': ['7: International Date Line', '8: Introduction to Economics', '9: Trade', '10: Urbanisation', '11: Transport and Communication', '12: Tourism']
  }
};

const MARKS_OPTIONS = ['20', '40', '80', '100'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

// Default question paper templates for each subject
const DEFAULT_PAPERS: Record<string, string> = {
  'English': 'Standard Maharashtra Board English Paper with Prose, Poetry, Grammar sections',
  'Math 1 (Algebra)': 'Standard Algebra Paper with MCQ, Short Answers, Long Problems',
  'Math 2 (Geometry)': 'Standard Geometry Paper with Constructions, Theorems, Problems'
};

export function TestGenerator() {
  const [subject, setSubject] = useState<string>('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [totalMarks, setTotalMarks] = useState<string>('40');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [testTitle, setTestTitle] = useState<string>('');
  const [includeGrammar, setIncludeGrammar] = useState(true);
  const [includeWriting, setIncludeWriting] = useState(true);
  const [useDefaultPaper, setUseDefaultPaper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<string | null>(null);
  const { toast } = useToast();

  const subjects = Object.keys(CLASS_9_CURRICULUM);
  const units = subject ? Object.keys(CLASS_9_CURRICULUM[subject as keyof typeof CLASS_9_CURRICULUM]) : [];
  
  const getChaptersForUnits = () => {
    if (!subject) return [];
    const subjectData = CLASS_9_CURRICULUM[subject as keyof typeof CLASS_9_CURRICULUM];
    let chapters: string[] = [];
    selectedUnits.forEach(unit => {
      if (subjectData[unit as keyof typeof subjectData]) {
        chapters = [...chapters, ...(subjectData[unit as keyof typeof subjectData] as string[])];
      }
    });
    return chapters;
  };

  const toggleUnit = (unit: string) => {
    if (selectedUnits.includes(unit)) {
      setSelectedUnits(selectedUnits.filter(u => u !== unit));
      // Remove chapters from this unit
      const subjectData = CLASS_9_CURRICULUM[subject as keyof typeof CLASS_9_CURRICULUM];
      const unitChapters = subjectData[unit as keyof typeof subjectData] as string[];
      setSelectedChapters(selectedChapters.filter(c => !unitChapters.includes(c)));
    } else {
      setSelectedUnits([...selectedUnits, unit]);
    }
  };

  const toggleChapter = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const selectAllChapters = () => {
    const availableChapters = getChaptersForUnits();
    setSelectedChapters(availableChapters.length === selectedChapters.length ? [] : [...availableChapters]);
  };

  const selectAllUnits = () => {
    if (selectedUnits.length === units.length) {
      setSelectedUnits([]);
      setSelectedChapters([]);
    } else {
      setSelectedUnits([...units]);
    }
  };

  const isLanguageSubject = () => {
    return ['English', 'Hindi (हिंदी)', 'Sanskrit (संस्कृत)', 'Marathi (मराठी)'].includes(subject);
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

      const marksNum = parseInt(totalMarks);
      const timeAllotted = marksNum === 20 ? '45 Minutes' : marksNum === 40 ? '1.5 Hours' : marksNum === 80 ? '2.5 Hours' : '3 Hours';
      
      const grammarWritingNote = isLanguageSubject() ? `
Include these sections for language:
${includeGrammar ? '- Grammar section with appropriate marks' : ''}
${includeWriting ? '- Writing Skills section (Essay/Letter/Paragraph)' : ''}` : '';

      const difficultyNote = difficulty === 'Easy' 
        ? 'Questions should be straightforward, testing basic understanding only.' 
        : difficulty === 'Hard' 
        ? 'Questions should be challenging, requiring deep understanding, application, and analytical thinking. Include HOTS (Higher Order Thinking Skills) questions.'
        : 'Mix of basic, intermediate and application-based questions.';

      const prompt = `You are an expert Maharashtra State Board (MSBSHSE) examiner creating question papers following shala.com and Balbharti textbook standards.

**CRITICAL INSTRUCTIONS:**
1. Generate a COMPLETELY NEW and UNIQUE question paper - never repeat previous questions
2. Each question must be meaningful, clear, and appropriate for Class 9 students
3. Follow the EXACT Maharashtra Board exam pattern
4. Questions must be ${difficulty.toUpperCase()} level: ${difficultyNote}

**Test Details:**
- Class: 9th Standard (Maharashtra Board)
- Subject: ${subject}
- Selected Units: ${selectedUnits.join(', ')}
- Chapters: ${selectedChapters.join(', ')}
- Total Marks: ${totalMarks}
- Time: ${timeAllotted}
- Title: ${testTitle || `Class 9 - ${subject} Test`}
- Difficulty: ${difficulty}
${grammarWritingNote}

**Generate a COMPLETE question paper with PROPER marking scheme:**

---
**${testTitle || `Class 9 - ${subject} Examination`}**
**Maharashtra State Board of Secondary and Higher Secondary Education**
**Total Marks: ${totalMarks} | Time: ${timeAllotted}**
**Difficulty Level: ${difficulty}**

---

**General Instructions:**
1. All questions are compulsory.
2. Draw neat diagrams wherever necessary.
3. Use of calculator is not allowed.
4. Figures to the right indicate full marks.

---

${marksNum >= 80 ? `
**SECTION A - Objective Type Questions** [${Math.round(marksNum * 0.15)} Marks]
- MCQ (Multiple Choice Questions) [1 mark each]
- Fill in the blanks [1 mark each]
- True/False with correction [1 mark each]
- Match the following [1 mark each]

**SECTION B - Short Answer Questions Type-I** [${Math.round(marksNum * 0.20)} Marks]
- Answer in 2-3 sentences [2 marks each]
- Define/Give reasons/Distinguish between

**SECTION C - Short Answer Questions Type-II** [${Math.round(marksNum * 0.25)} Marks]
- Answer in 4-5 sentences [3 marks each]
- Explain/Describe/State and explain

**SECTION D - Long Answer Questions** [${Math.round(marksNum * 0.25)} Marks]
- Detailed answers [4-5 marks each]
- Derivations/Prove/Solve with steps

**SECTION E - Very Long Answer / Application Based** [${Math.round(marksNum * 0.15)} Marks]
- Comprehensive answers [5-6 marks each]
- Case study/Activity based questions
` : marksNum >= 40 ? `
**SECTION A - Objective Questions** [${Math.round(marksNum * 0.20)} Marks]
- MCQ, Fill in blanks, True/False

**SECTION B - Short Answer Questions** [${Math.round(marksNum * 0.35)} Marks]
- 2-3 marks each, answer briefly

**SECTION C - Long Answer Questions** [${Math.round(marksNum * 0.30)} Marks]
- 4-5 marks each, detailed answers

**SECTION D - Application Based** [${Math.round(marksNum * 0.15)} Marks]
- Higher order questions
` : `
**SECTION A - Objective Questions** [${Math.round(marksNum * 0.25)} Marks]
- MCQ, Fill in blanks, True/False [1 mark each]

**SECTION B - Short Answers** [${Math.round(marksNum * 0.40)} Marks]
- Brief explanations [2 marks each]

**SECTION C - Long Answers** [${Math.round(marksNum * 0.35)} Marks]
- Detailed answers [3-4 marks each]
`}

**IMPORTANT:**
- Number all questions clearly (Q.1, Q.2, etc.)
- Show marks for each question in brackets like [2 marks]
- Cover ALL selected chapters proportionally
- For Math/Science: Include numerical problems and diagrams
- For Languages: Include comprehension, grammar, writing sections
- Make questions ${difficulty.toLowerCase()} but meaningful and exam-standard
- End with: ✱✱✱ Best of Luck! ✱✱✱`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: { 
          messages: [{ role: 'user', content: prompt }], 
          model: 'openai/gpt-5.2',
          mode: 'normal'
        },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      setGeneratedTest(data.reply);
      toast({ title: 'Test Generated!', description: `${difficulty} difficulty paper ready for download` });
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate test', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedTest) return;

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testTitle || `Class 9 - ${subject} Test`}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', serif; 
      padding: 40px; 
      line-height: 1.8; 
      max-width: 800px; 
      margin: auto; 
      background: white;
      color: black;
    }
    h1, h2, h3 { color: #1a1a1a; margin: 15px 0; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; font-size: 24px; }
    h2 { background: #f5f5f5; padding: 8px 12px; margin-top: 25px; font-size: 18px; border-left: 4px solid #333; }
    h3 { font-size: 16px; }
    p { margin: 10px 0; }
    .content { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; }
    @media print { 
      body { padding: 20px; } 
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="content">${generatedTest.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;

    const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${testTitle || `Class-9-${subject}-${difficulty}-Test`}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ 
      title: 'Test Paper Downloaded!', 
      description: 'Open the HTML file and use Print → Save as PDF to create a PDF.' 
    });
  };

  const downloadAsTxt = () => {
    if (!generatedTest) return;

    const blob = new Blob([generatedTest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${testTitle || `Class-9-${subject}-${difficulty}-Test`}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Test Paper Downloaded as Text!' });
  };

  const availableChapters = getChaptersForUnits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Class 9 Test Generator</h2>
        </div>
        <p className="text-muted-foreground">Maharashtra Board - Powered by AI</p>
        <div className="flex justify-center gap-2 flex-wrap">
          <Badge variant="outline">shala.com Style</Badge>
          <Badge variant="outline">Balbharti Pattern</Badge>
          <Badge variant="secondary">AI Generated</Badge>
        </div>
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
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={(val) => { setSubject(val); setSelectedUnits([]); setSelectedChapters([]); }}>
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

          {/* Unit Selection */}
          {subject && units.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Units ({selectedUnits.length} selected)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllUnits}>
                  {units.length === selectedUnits.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {units.map(unit => (
                  <Button
                    key={unit}
                    variant={selectedUnits.includes(unit) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleUnit(unit)}
                    className="text-xs"
                  >
                    {unit}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter Selection */}
          {selectedUnits.length > 0 && availableChapters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Chapters ({selectedChapters.length} selected)</Label>
                <Button variant="ghost" size="sm" onClick={selectAllChapters}>
                  {availableChapters.length === selectedChapters.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollArea className="h-48 rounded-lg border p-3">
                <div className="space-y-2">
                  {availableChapters.map(ch => (
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

          {/* Marks, Difficulty & Options */}
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
              <Label>Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language-specific options */}
          {isLanguageSubject() && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-medium">Language Paper Options</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includeGrammar} onCheckedChange={(c) => setIncludeGrammar(!!c)} />
                  <span className="text-sm">Include Grammar Section</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={includeWriting} onCheckedChange={(c) => setIncludeWriting(!!c)} />
                  <span className="text-sm">Include Writing Skills</span>
                </label>
              </div>
            </div>
          )}

          {/* Test Title */}
          <div className="space-y-2">
            <Label>Test Title (optional)</Label>
            <Input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="e.g., Unit Test 1, Half Yearly Exam"
              className="h-12"
            />
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
                Generating {difficulty} Paper with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate {difficulty} Question Paper
              </>
            )}
          </Button>

          {/* Info Note */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Each test paper is uniquely generated using advanced AI (GPT-5.2) following shala.com and Balbharti patterns. Papers will not repeat.</p>
          </div>
        </CardContent>
      </Card>

      {/* Generated Test */}
      {generatedTest && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Question Paper
                <Badge variant="secondary">{difficulty}</Badge>
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={downloadAsTxt} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span> TXT
                </Button>
                <Button onClick={downloadPDF} variant="default" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span> HTML
                </Button>
              </div>
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