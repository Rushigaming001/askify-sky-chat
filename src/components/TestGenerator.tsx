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

// Class 9 Complete Curriculum with Units - EXACT as specified by user
const CLASS_9_CURRICULUM = {
  'English': {
    'Unit One': [
      '1.1: Life',
      '1.2: A Synopsis-The Swiss Family Robinson',
      '1.3: Have you ever seen...?',
      '1.4: Have you thought of the verb \'have\'',
      '1.5: The Necklace'
    ],
    'Unit Two': [
      '2.1: Invictus',
      '2.2: A True Story of Sea Turtles',
      '2.3: Somebody\'s Mother',
      '2.4: The Fall of Troy',
      '2.5: Autumn',
      '2.6: The Past in the Present'
    ],
    'Unit Three': [
      '3.1: Silver',
      '3.2: Reading Works of Art',
      '3.3: The Road Not Taken',
      '3.4: How the First Letter was Written'
    ],
    'Unit Four': [
      '4.1: Please Listen!',
      '4.2: The Storyteller',
      '4.3: Intellectual Rubbish',
      '4.4: My Financial Career',
      '4.5: Tansen'
    ],
    'Grammar & Writing Skills': [
      'Grammar',
      'Writing Skills'
    ]
  },
  'Hindi (हिंदी)': {
    'पहली इकाई (First Unit)': [
      '१: नदी की पुकार',
      '२: झुमका',
      '३: निज भाषा',
      '४: मान जा मेरे मन',
      '५: किताबें कुछ कहना चाहती हैं',
      '६: \'इत्यादि\' की आत्मकहानी',
      '७: छोटा जादुगर',
      '८: जिंदगी की बड़ी जरुरत है हार...!'
    ],
    'दूसरी इकाई (Second Unit)': [
      '१: गागर में सागर',
      '२: मैं बरतन माँजूँगा',
      '३: ग्रामदेवता',
      '४: साहित्य की निष्कपट विधा है - डायरी',
      '५: उम्मीद',
      '६: सागर और मेघ',
      '७: लघुकथाएँ',
      '८: झंडा ऊँचा सदा रहेगा',
      '९: रचना विभाग एवं व्याकरण विभाग'
    ]
  },
  'Sanskrit (संस्कृत)': {
    'गद्यात्मकम् (Prose)': [
      'संस्कृतम्',
      'विद्यावन्तः',
      'समयः'
    ],
    'पद्यात्मकम् (Poetry)': [
      'सुभाषिते खरे',
      'कालमहत्त्वम्',
      'किं कर्तव्यम्? किं न कर्तव्यम्?',
      'विद्याधनम्',
      'वैराग्यस्य महत्त्वम्',
      'नभसि विद्युतः, मनुजाः संस्कृताः'
    ],
    'संवादात्मकम् / कथात्मकम्': [
      'सूत्रधारा',
      'मम स्वदेशः',
      'अस्माकं जीवनम्',
      'कालस्य महत्त्वम्'
    ],
    'व्याकरणम् (Grammar)': [
      'कः कदा? किं कुत्र?',
      'वाक्य संरचना',
      'क्रिया कर्ता च',
      'विभक्तयः',
      'कालाः (लट्, लङ्, लृट्)',
      'उपसर्गाः',
      'समासाः',
      'सन्धयः',
      'शब्दरूपाणि – १',
      'शब्दरूपाणि – २',
      'धातुरूपाणि'
    ],
    'भाषा-कौशलम्': [
      'अनुवादः',
      'संवादलेखनम्',
      'चित्रवर्णनम्',
      'पत्रलेखनम्'
    ]
  },
  'Marathi (मराठी)': {
    'भाग – १': [
      'संतवाणीचे संदर्भ',
      '(अ) संतवाणी – माणसाचा जीवन : संत एकनाथ',
      '(आ) संतवाणी – संतवाणी शाळा : संत तुकाराम',
      'दलितांचे आंबेडकर',
      'डॉ. आ. पां. रेगे',
      'कालचक्र'
    ],
    'भाग – २': [
      'ध्यानातले पहाट',
      'ओळखीचा वेडाचा गाव',
      'विज्ञान यात्रेची दिवस',
      'सूत्र आणि',
      'हरवलेलं मूल'
    ],
    'भाग – ३': [
      'उजाड उघडे माळरान',
      'छपर',
      'आमच्यातल्या पाखराला',
      'मुला एकदा',
      'होमी'
    ],
    'भाग – ४': [
      'निष्पन्न',
      'जीवनातला आनंद',
      'माझी हिरवळ संस्कार',
      'स्वतंत्र लेख',
      'विज्ञापन',
      'उपयोजित लेखन'
    ]
  },
  'Math 1 - Algebra': {
    'All Chapters': [
      'Sets',
      'Real Numbers',
      'Polynomials',
      'Ratio and Proportion',
      'Linear Equations in Two Variables',
      'Financial Planning',
      'Statistics'
    ]
  },
  'Math 2 - Geometry': {
    'All Chapters': [
      'Basic Concepts in Geometry',
      'Parallel Lines',
      'Triangles',
      'Constructions of Triangles',
      'Quadrilaterals',
      'Circle',
      'Co-ordinate Geometry',
      'Trigonometry',
      'Surface Area and Volume'
    ]
  },
  'Science 1': {
    'Unit 1': [
      '1: Laws of Motion',
      '2: Work and Energy',
      '3: Current Electricity',
      '4: Measurement of Matter',
      '5: Acids, Bases and Salts',
      '6: Classification of Plants',
      '7: Energy Flow in an Ecosystem',
      '8: Useful and Harmful Microbes',
      '9: Environmental Management',
      '10: Information Communication Technology (ICT)'
    ]
  },
  'Science 2': {
    'Unit 2 (Second Unit)': [
      '11: Reflection of Light',
      '12: Study of Sound',
      '13: Carbon: An important element',
      '14: Substances in Common Use',
      '15: Life Processes in Living Organisms',
      '16: Heredity and Variation',
      '17: Introduction to Biotechnology',
      '18: Observing Space: Telescopes'
    ]
  },
  'History & Political Science': {
    'History - India after Independence (1961 CE to 2000 CE)': [
      '1: Sources of History',
      '2: India : Events after 1960',
      '3: India\'s Internal Challenges',
      '4: Economic Development',
      '5: Education',
      '6: Empowerment of Women and other Weaker Sections',
      '7: Science and Technology',
      '8: Industry and Trade',
      '9: Changing Life: 1',
      '10: Changing Life: 2'
    ],
    'Political Science - India and World': [
      '1: Post World War Political Developments',
      '2: India\'s Foreign Policy',
      '3: India\'s Defence System',
      '4: The United Nations',
      '5: India and Other Countries',
      '6: International Problems'
    ]
  },
  'Geography': {
    'Unit 1': [
      '1: Distributional Maps',
      '2: Endogenetic Movements',
      '3: Exogenetic Movements Part-1',
      '4: Exogenetic Movements Part-2',
      '5: Precipitation',
      '6: Properties of sea water'
    ],
    'Unit 2 (Second Unit)': [
      '7: International Date Line',
      '8: Introduction to Economics',
      '9: Trade',
      '10: Urbanisation',
      '11: Transport and Communication',
      '12: Tourism'
    ]
  }
};

const MARKS_OPTIONS = ['20', '40', '80', '100'];
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

// Default question paper templates for each subject
const DEFAULT_PAPERS: Record<string, string> = {
  'English': `
**ENGLISH - CLASS 9 - STANDARD TEST PAPER**
**Maharashtra State Board Pattern**
**Total Marks: 40 | Time: 1.5 Hours**

---

**SECTION A - READING COMPREHENSION** [10 Marks]

Q.1 Read the following passage and answer the questions: [5]
(Passage from Unit One - Life)

a) What is the central theme of the passage? [1]
b) Explain the meaning of any two difficult words. [1]
c) What message does the author convey? [2]
d) Give a suitable title to the passage. [1]

Q.2 Read the poem extract and answer: [5]
(From "Invictus" or "Silver")

a) Name the poem and poet. [1]
b) What emotions are expressed? [2]
c) Explain any one poetic device used. [2]

---

**SECTION B - GRAMMAR** [10 Marks]

Q.3 Do as directed: [5]
a) Change the voice: "The teacher praised the students."
b) Fill in the blank with correct tense: She ___ (write) a letter now.
c) Identify the clause: "When the bell rang, the students left."
d) Make a question tag: "You have completed your homework, ___?"
e) Use the correct form of verb 'have': They ___ a beautiful garden.

Q.4 Rewrite as directed: [5]
a) Combine using 'although'
b) Change to indirect speech
c) Fill in with appropriate preposition
d) Identify the type of sentence
e) Punctuate correctly

---

**SECTION C - WRITING SKILLS** [10 Marks]

Q.5 Write an essay on any ONE topic: [5]
a) The Importance of Education
b) Environmental Conservation
c) My Favourite Book

Q.6 Write a letter to your friend describing your summer vacation. [5]

---

**SECTION D - TEXTUAL QUESTIONS** [10 Marks]

Q.7 Answer in brief (any 2): [4]
a) Describe the Swiss Family Robinson's adventure.
b) What lesson do we learn from "The Necklace"?
c) Explain the moral of "Somebody's Mother".

Q.8 Answer in detail (any 1): [6]
a) Character sketch of Mathilde Loisel from "The Necklace".
b) Explain the significance of the title "Invictus".

---
✱✱✱ Best of Luck! ✱✱✱
`,
  'Math 1 - Algebra': `
**MATHEMATICS PART 1 (ALGEBRA) - CLASS 9**
**Maharashtra State Board Pattern**
**Total Marks: 40 | Time: 1.5 Hours**

---

**SECTION A - OBJECTIVE QUESTIONS** [10 Marks]

Q.1 Choose the correct answer: [5]
a) Which of the following is an irrational number?
   i) √4  ii) √5  iii) 0.25  iv) 3/4

b) The degree of polynomial 3x² + 5x - 7 is:
   i) 1  ii) 2  iii) 3  iv) 0

c) If A = {1, 2, 3} and B = {2, 3, 4}, then A ∩ B is:
   i) {1, 2, 3, 4}  ii) {2, 3}  iii) {1}  iv) {4}

d) The ratio 3:5 can be written as:
   i) 3/5  ii) 5/3  iii) 8  iv) 15

e) In linear equation ax + by = c, if a = 0, the graph is:
   i) Vertical line  ii) Horizontal line  iii) Passing through origin  iv) None

Q.2 Fill in the blanks: [3]
a) A set with no elements is called _____.
b) √2 × √8 = _____.
c) If x:y = 2:3 and y:z = 3:4, then x:z = _____.

Q.3 State True or False: [2]
a) Every rational number is a real number.
b) Empty set is a subset of every set.

---

**SECTION B - SHORT ANSWERS** [15 Marks]

Q.4 Solve (any 3): [9]
a) Find the HCF of 12, 18, and 24 using prime factorization.
b) Simplify: √75 + √27 - √12
c) If A = {a, b, c, d} and B = {c, d, e, f}, find A ∪ B and A - B.
d) Divide the polynomial: (x³ + 2x² - 5x + 2) ÷ (x - 1)

Q.5 Solve the linear equations graphically: [6]
x + y = 5
2x - y = 4

---

**SECTION C - LONG ANSWERS** [15 Marks]

Q.6 Solve (any 2): [10]
a) A sum of ₹10,000 is invested at 10% p.a. compound interest. Find the amount after 2 years.
b) Find the mean, median, and mode of: 5, 8, 10, 12, 8, 6, 8, 15
c) If the ratio of ages of father and son is 7:2 and after 10 years it will be 9:4, find their present ages.

Q.7 Answer in detail: [5]
Explain the properties of real numbers with examples.

---
✱✱✱ Best of Luck! ✱✱✱
`
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
    // If using default paper
    if (useDefaultPaper && DEFAULT_PAPERS[subject]) {
      setGeneratedTest(DEFAULT_PAPERS[subject]);
      toast({ title: 'Default Paper Loaded!', description: 'Standard paper template ready for download' });
      return;
    }

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
        ? 'Questions should be straightforward, testing basic understanding and recall. Focus on definitions, simple applications, and direct questions from the textbook.' 
        : difficulty === 'Hard' 
        ? 'Questions should be challenging, requiring deep understanding, application, analysis, and Higher Order Thinking Skills (HOTS). Include numerical problems, case studies, and questions that require critical thinking and multi-step reasoning.'
        : 'Balanced mix of basic recall questions, application-based questions, and some analytical questions.';

      // Generate a unique seed for each generation
      const uniqueSeed = Date.now() + Math.random();

      const prompt = [
        `You are an expert Maharashtra State Board (Class 9) paper setter.`,
        `Create a NEW and UNIQUE question paper every time. Do not repeat previous papers.`,
        `Randomization seed: ${uniqueSeed}.`,
        `Subject: ${subject}.`,
        `Total Marks: ${totalMarks}. Time: ${timeAllotted}.`,
        `Difficulty: ${difficulty}. ${difficultyNote}`,
        `Syllabus coverage (use proportionally): ${selectedChapters.join(' | ')}.`,
        isLanguageSubject()
          ? `Include sections as applicable: ${includeGrammar ? 'Grammar' : ''}${includeGrammar && includeWriting ? ' + ' : ''}${includeWriting ? 'Writing Skills' : ''}.`
          : '',
        `Format rules:`,
        `- Number questions clearly (Q.1, Q.2, ...)`,
        `- Show marks for each question like [2 marks]`,
        `- Follow Maharashtra Board pattern for ${totalMarks} marks (objective + short + long + application/HOTS as needed)`,
        `- Questions must be meaningful, exam-standard, and appropriate for Class 9`,
        `Return ONLY the question paper (no explanation). End with: ✱✱✱ Best of Luck! ✱✱✱`,
      ]
        .filter(Boolean)
        .join('\n');

      // Try GPT-5.2 first, fallback to other models
      let response;
      const models = ['gpt-5.2', 'askify', 'gemini-3', 'gpt'];
      
      for (const model of models) {
        try {
          response = await supabase.functions.invoke('chat', {
            body: { 
              messages: [{ role: 'user', content: prompt }], 
              model: model,
              mode: 'normal'
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          
          if (!response.error && response.data?.reply) {
            break;
          }
        } catch (e) {
          console.log(`Model ${model} failed, trying next...`);
        }
      }

      if (response?.error) throw response.error;

      setGeneratedTest(response?.data?.reply || 'Failed to generate test');
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Class 9 Test Generator
          </h1>
        </div>
        <p className="text-muted-foreground">Maharashtra State Board - AI Powered Question Papers</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline">shala.com Pattern</Badge>
          <Badge variant="outline">Balbharti Syllabus</Badge>
          <Badge variant="outline">Unique Questions</Badge>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">
            <BookOpen className="h-4 w-4 mr-2" />
            Configure Test
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!generatedTest}>
            <FileText className="h-4 w-4 mr-2" />
            Generated Paper
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-6">
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
                  setUseDefaultPaper(false);
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

                {subject && DEFAULT_PAPERS[subject] && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
                    <Checkbox 
                      id="useDefault" 
                      checked={useDefaultPaper}
                      onCheckedChange={(checked) => setUseDefaultPaper(checked as boolean)}
                    />
                    <Label htmlFor="useDefault" className="text-sm cursor-pointer">
                      Use Default Paper (Same every time)
                    </Label>
                  </div>
                )}
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
                        {m} Marks
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Difficulty Level</Label>
                  <div className="flex gap-2 mt-2">
                    {DIFFICULTY_OPTIONS.map(d => (
                      <Button
                        key={d}
                        variant={difficulty === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDifficulty(d)}
                        className={difficulty === d ? (
                          d === 'Easy' ? 'bg-green-600 hover:bg-green-700' :
                          d === 'Hard' ? 'bg-red-600 hover:bg-red-700' :
                          ''
                        ) : ''}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Test Title (Optional)</Label>
                  <Input
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="e.g., First Unit Test"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Units Selection */}
          {subject && !useDefaultPaper && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Select Units</CardTitle>
                  <Button variant="outline" size="sm" onClick={selectAllUnits}>
                    {selectedUnits.length === units.length ? 'Deselect All' : 'Select All Units'}
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
                      className="text-xs"
                    >
                      {unit}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chapters Selection */}
          {selectedUnits.length > 0 && !useDefaultPaper && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Select Chapters ({selectedChapters.length}/{availableChapters.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={selectAllChapters}>
                    {selectedChapters.length === availableChapters.length ? 'Deselect All' : 'Select All Chapters'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {availableChapters.map(chapter => (
                      <div key={chapter} className="flex items-center gap-2">
                        <Checkbox
                          id={chapter}
                          checked={selectedChapters.includes(chapter)}
                          onCheckedChange={() => toggleChapter(chapter)}
                        />
                        <Label htmlFor={chapter} className="text-sm cursor-pointer flex-1">
                          {chapter}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Language-specific options */}
          {isLanguageSubject() && !useDefaultPaper && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Language Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="grammar"
                      checked={includeGrammar}
                      onCheckedChange={(checked) => setIncludeGrammar(checked as boolean)}
                    />
                    <Label htmlFor="grammar" className="cursor-pointer">Include Grammar Section</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="writing"
                      checked={includeWriting}
                      onCheckedChange={(checked) => setIncludeWriting(checked as boolean)}
                    />
                    <Label htmlFor="writing" className="cursor-pointer">Include Writing Skills</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateTest}
            disabled={loading || (!useDefaultPaper && (!subject || selectedChapters.length === 0))}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Unique Paper...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Test Paper
              </>
            )}
          </Button>

          {!useDefaultPaper && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <AlertCircle className="h-4 w-4" />
              <span>Each generation creates a completely new and unique question paper</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="result" className="mt-6">
          {generatedTest && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generated Question Paper
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={downloadPDF} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>
                    <Button onClick={downloadAsTxt} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download TXT
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-white dark:bg-slate-900">
                  <pre className="whitespace-pre-wrap font-mono text-sm">{generatedTest}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
