import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Download, Sparkles, GraduationCap, BookOpen, AlertCircle, Upload, RefreshCw } from 'lucide-react';
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
    'Grammar & Writing Skills': ['Grammar', 'Writing Skills']
  },
  'Hindi (हिंदी)': {
    'पहली इकाई': ['१: नदी की पुकार', '२: झुमका', '३: निज भाषा', '४: मान जा मेरे मन', '५: किताबें कुछ कहना चाहती हैं', '६: \'इत्यादि\' की आत्मकहानी', '७: छोटा जादुगर', '८: जिंदगी की बड़ी जरुरत है हार...!'],
    'दूसरी इकाई': ['१: गागर में सागर', '२: मैं बरतन माँजूँगा', '३: ग्रामदेवता', '४: साहित्य की निष्कपट विधा है - डायरी', '५: उम्मीद', '६: सागर और मेघ', '७: लघुकथाएँ', '८: झंडा ऊँचा सदा रहेगा', '९: रचना विभाग एवं व्याकरण विभाग']
  },
  'Sanskrit (संस्कृत)': {
    'गद्यात्मकम्': ['संस्कृतम्', 'विद्यावन्तः', 'समयः'],
    'पद्यात्मकम्': ['सुभाषिते खरे', 'कालमहत्त्वम्', 'किं कर्तव्यम्? किं न कर्तव्यम्?', 'विद्याधनम्', 'वैराग्यस्य महत्त्वम्', 'नभसि विद्युतः, मनुजाः संस्कृताः'],
    'व्याकरणम्': ['कः कदा? किं कुत्र?', 'वाक्य संरचना', 'क्रिया कर्ता च', 'विभक्तयः', 'कालाः', 'उपसर्गाः', 'समासाः', 'सन्धयः', 'शब्दरूपाणि', 'धातुरूपाणि']
  },
  'Marathi (मराठी)': {
    'भाग – १': ['संतवाणीचे संदर्भ', 'दलितांचे आंबेडकर', 'डॉ. आ. पां. रेगे', 'कालचक्र'],
    'भाग – २': ['ध्यानातले पहाट', 'ओळखीचा वेडाचा गाव', 'विज्ञान यात्रेची दिवस', 'सूत्र आणि', 'हरवलेलं मूल'],
    'भाग – ३': ['उजाड उघडे माळरान', 'छपर', 'आमच्यातल्या पाखराला', 'मुला एकदा', 'होमी'],
    'भाग – ४': ['निष्पन्न', 'जीवनातला आनंद', 'माझी हिरवळ संस्कार', 'स्वतंत्र लेख', 'विज्ञापन', 'उपयोजित लेखन']
  },
  'Math 1 - Algebra': {
    'All Chapters': ['Sets', 'Real Numbers', 'Polynomials', 'Ratio and Proportion', 'Linear Equations in Two Variables', 'Financial Planning', 'Statistics']
  },
  'Math 2 - Geometry': {
    'All Chapters': ['Basic Concepts in Geometry', 'Parallel Lines', 'Triangles', 'Constructions of Triangles', 'Quadrilaterals', 'Circle', 'Co-ordinate Geometry', 'Trigonometry', 'Surface Area and Volume']
  },
  'Science 1': {
    'Unit 1': ['1: Laws of Motion', '2: Work and Energy', '3: Current Electricity', '4: Measurement of Matter', '5: Acids, Bases and Salts', '6: Classification of Plants', '7: Energy Flow in an Ecosystem', '8: Useful and Harmful Microbes', '9: Environmental Management', '10: Information Communication Technology']
  },
  'Science 2': {
    'Unit 2': ['11: Reflection of Light', '12: Study of Sound', '13: Carbon: An important element', '14: Substances in Common Use', '15: Life Processes in Living Organisms', '16: Heredity and Variation', '17: Introduction to Biotechnology', '18: Observing Space: Telescopes']
  },
  'History & Political Science': {
    'History': ['1: Sources of History', '2: India : Events after 1960', '3: India\'s Internal Challenges', '4: Economic Development', '5: Education', '6: Empowerment of Women and other Weaker Sections', '7: Science and Technology', '8: Industry and Trade', '9: Changing Life: 1', '10: Changing Life: 2'],
    'Political Science': ['1: Post World War Political Developments', '2: India\'s Foreign Policy', '3: India\'s Defence System', '4: The United Nations', '5: India and Other Countries', '6: International Problems']
  },
  'Geography': {
    'Unit 1': ['1: Distributional Maps', '2: Endogenetic Movements', '3: Exogenetic Movements Part-1', '4: Exogenetic Movements Part-2', '5: Precipitation', '6: Properties of sea water'],
    'Unit 2': ['7: International Date Line', '8: Introduction to Economics', '9: Trade', '10: Urbanisation', '11: Transport and Communication', '12: Tourism']
  }
};

const MARKS_OPTIONS = ['20', '40', '80', '100'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

export function TestGenerator() {
  const [subject, setSubject] = useState<string>('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [totalMarks, setTotalMarks] = useState<string>('40');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [testTitle, setTestTitle] = useState<string>('');
  const [includeGrammar, setIncludeGrammar] = useState(true);
  const [includeWriting, setIncludeWriting] = useState(true);
  const [includePassage, setIncludePassage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [generatedTest, setGeneratedTest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [remakeInput, setRemakeInput] = useState('');
  const [remakeLoading, setRemakeLoading] = useState(false);
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
      
      const difficultyNote = difficulty === 'Easy' 
        ? 'Focus on basic understanding, definitions, and simple recall questions.' 
        : difficulty === 'Hard' 
        ? 'Include challenging HOTS questions, application-based problems, case studies, and multi-step reasoning.'
        : 'Balanced mix of basic and application-based questions.';

      const passageSection = (subject === 'English' && includePassage) ? `

**IMPORTANT: Include an UNSEEN PASSAGE section (not from textbook) with 5 comprehension questions worth 10 marks.**
The passage should be around 150-200 words on a general topic (nature, technology, environment, etc.).` : '';

      const prompt = `Create a ${totalMarks} marks ${subject} question paper for Class 9 Maharashtra State Board.

**FORMAT REQUIREMENTS:**
- Time: ${timeAllotted}
- Difficulty: ${difficulty} - ${difficultyNote}
- Pattern: Follow shala.com and balbharti.com exam pattern exactly

**CHAPTERS TO COVER (distribute questions proportionally):**
${selectedChapters.join(', ')}

${isLanguageSubject() ? `**LANGUAGE SECTIONS:**
${includeGrammar ? '- Grammar section with appropriate marks' : ''}
${includeWriting ? '- Writing Skills (Essay/Letter/Paragraph)' : ''}` : ''}
${passageSection}

**SPACING & FORMATTING:**
- Use clear section headers: **SECTION A**, **SECTION B**, etc.
- Add blank lines between questions
- Show marks clearly: [2 marks], [5 marks], etc.
- Number all questions: Q.1, Q.2, Q.3, etc.
- Add proper sub-question numbering: a), b), c) or i), ii), iii)

**STRUCTURE:**
- Section A: Objective/MCQ (if applicable)
- Section B: Short Answer Questions (2-3 marks each)
- Section C: Long Answer Questions (5-6 marks each)
- Section D: Application/HOTS (for Hard difficulty)

**IMPORTANT:**
- Generate UNIQUE questions each time
- Questions must be exam-standard and appropriate for Class 9
- End with: ✱✱✱ Best of Luck! ✱✱✱

Generate the complete question paper now:`;

      const response = await supabase.functions.invoke('test-generator', {
        body: { prompt },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw response.error;
      
      const paper = response.data?.paper;
      if (!paper) {
        throw new Error('No response generated');
      }

      setGeneratedTest(paper);
      setActiveTab('result');
      toast({ title: 'Test Generated!', description: `${difficulty} difficulty paper ready in seconds!` });
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate test', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const remakeQuestions = async () => {
    if (!remakeInput.trim()) {
      toast({ title: 'Error', description: 'Please paste your question paper', variant: 'destructive' });
      return;
    }

    setRemakeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: 'Error', description: 'Please log in', variant: 'destructive' });
        return;
      }

      const prompt = `You are an expert question paper modifier. Take the following question paper and create a NEW version with DIFFERENT questions on the SAME topics and format.

**ORIGINAL PAPER:**
${remakeInput}

**INSTRUCTIONS:**
1. Keep the SAME format, marks distribution, and structure
2. Keep the SAME section headers and time
3. REPLACE all questions with NEW, DIFFERENT questions on similar topics
4. Maintain the same difficulty level
5. For MCQs, change both questions and options
6. For descriptive questions, ask about different aspects
7. End with: ✱✱✱ Best of Luck! ✱✱✱

Generate the modified question paper now:`;

      const response = await supabase.functions.invoke('test-generator', {
        body: { prompt },
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw response.error;
      
      const paper = response.data?.paper;
      if (!paper) throw new Error('No response generated');

      setGeneratedTest(paper);
      setActiveTab('result');
      toast({ title: 'Questions Remade!', description: 'New version ready with different questions' });
    } catch (error: any) {
      console.error('Error remaking questions:', error);
      toast({ title: 'Error', description: error.message || 'Failed to remake questions', variant: 'destructive' });
    } finally {
      setRemakeLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedTest) return;

    const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${testTitle || `Class 9 - ${subject} Test`}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', Georgia, serif; 
      padding: 50px 60px; 
      line-height: 2; 
      max-width: 900px; 
      margin: auto; 
      background: white;
      color: #1a1a1a;
      font-size: 14px;
    }
    h1, h2, h3 { color: #000; margin: 20px 0 15px 0; font-weight: bold; }
    h1 { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; font-size: 22px; margin-bottom: 25px; }
    h2 { background: #f0f0f0; padding: 10px 15px; margin-top: 30px; font-size: 16px; border-left: 5px solid #333; }
    h3 { font-size: 15px; margin-top: 20px; }
    p, li { margin: 12px 0; line-height: 2.2; }
    .content { 
      white-space: pre-wrap; 
      word-wrap: break-word; 
      font-family: inherit; 
      font-size: 14px;
      line-height: 2.2;
    }
    strong { font-weight: bold; }
    @media print { 
      body { padding: 30px 40px; } 
      @page { margin: 1.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="content">${generatedTest.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '\n\n<br>\n')}</div>
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

    toast({ title: 'Downloaded!', description: 'Open the HTML file and Print → Save as PDF' });
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

    toast({ title: 'Downloaded as Text!' });
  };

  const availableChapters = getChaptersForUnits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Class 9 Test Generator
          </h1>
        </div>
        <p className="text-muted-foreground">Maharashtra State Board - AI Powered Question Papers</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline">⚡ Fast Generation (5-10s)</Badge>
          <Badge variant="outline">shala.com Pattern</Badge>
          <Badge variant="outline">Balbharti Syllabus</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="remake">
            <RefreshCw className="h-4 w-4 mr-2" />
            Remake
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedTest}>
            <FileText className="h-4 w-4 mr-2" />
            Result
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Subject Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Subject
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={subject} onValueChange={(val) => {
                  setSubject(val);
                  setSelectedUnits([]);
                  setSelectedChapters([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Marks & Difficulty */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Test Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Total Marks</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {MARKS_OPTIONS.map(m => (
                      <Button
                        key={m}
                        variant={totalMarks === m ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTotalMarks(m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {DIFFICULTY_OPTIONS.map(d => (
                      <Button
                        key={d}
                        variant={difficulty === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDifficulty(d)}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Units Selection */}
          {subject && units.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Units</CardTitle>
                  <Button variant="ghost" size="sm" onClick={selectAllUnits}>
                    {selectedUnits.length === units.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {units.map(unit => (
                    <Button
                      key={unit}
                      variant={selectedUnits.includes(unit) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleUnit(unit)}
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chapters Selection */}
          {availableChapters.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Chapters ({selectedChapters.length}/{availableChapters.length})</CardTitle>
                  <Button variant="ghost" size="sm" onClick={selectAllChapters}>
                    {selectedChapters.length === availableChapters.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {availableChapters.map(chapter => (
                      <div key={chapter} className="flex items-center gap-2">
                        <Checkbox
                          id={chapter}
                          checked={selectedChapters.includes(chapter)}
                          onCheckedChange={() => toggleChapter(chapter)}
                        />
                        <Label htmlFor={chapter} className="text-sm cursor-pointer">{chapter}</Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Language Options */}
          {isLanguageSubject() && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Language Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="grammar" checked={includeGrammar} onCheckedChange={(c) => setIncludeGrammar(c as boolean)} />
                  <Label htmlFor="grammar">Include Grammar Section</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="writing" checked={includeWriting} onCheckedChange={(c) => setIncludeWriting(c as boolean)} />
                  <Label htmlFor="writing">Include Writing Skills</Label>
                </div>
                {subject === 'English' && (
                  <div className="flex items-center gap-2">
                    <Checkbox id="passage" checked={includePassage} onCheckedChange={(c) => setIncludePassage(c as boolean)} />
                    <Label htmlFor="passage">Include Unseen Passage</Label>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Optional Title */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Optional: Test Title</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="e.g., Unit Test 1 - October 2024"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button 
            onClick={generateTest} 
            disabled={loading || !subject || selectedChapters.length === 0}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating (5-10 seconds)...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Test Paper
              </>
            )}
          </Button>
        </TabsContent>

        {/* Remake Tab */}
        <TabsContent value="remake" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Question Remake
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste your existing question paper and AI will create new questions with the same format
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your question paper here...&#10;&#10;AI will keep the same format, marks, and structure but replace all questions with new ones."
                value={remakeInput}
                onChange={(e) => setRemakeInput(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />
              <Button 
                onClick={remakeQuestions}
                disabled={remakeLoading || !remakeInput.trim()}
                className="w-full"
              >
                {remakeLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Remaking Questions...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Remake Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        <TabsContent value="result" className="space-y-4 mt-6">
          {generatedTest && (
            <>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={downloadPDF} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download HTML (Print as PDF)
                </Button>
                <Button onClick={downloadAsTxt} variant="outline" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Download as Text
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <ScrollArea className="h-[600px]">
                    <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                      {generatedTest}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
