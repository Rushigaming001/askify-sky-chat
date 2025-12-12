import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Trophy, Flame, Star, CheckCircle2, XCircle, 
  Volume2, ArrowRight, Home, Target, Award, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Language {
  id: string;
  name: string;
  flag: string;
  color: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'vocabulary' | 'sentences' | 'grammar' | 'quiz';
  difficulty: number;
  xp: number;
  completed: boolean;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'translation' | 'audio' | 'meaning' | 'hard';
  question: string;
  options?: string[];
  answer: string;
  pronunciation?: string;
  audio?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

const languages: Language[] = [
  { id: 'english', name: 'English', flag: '🇬🇧', color: 'from-blue-500 to-blue-600' },
  { id: 'hindi', name: 'Hindi', flag: '🇮🇳', color: 'from-orange-500 to-orange-600' },
  { id: 'marathi', name: 'Marathi', flag: '🇮🇳', color: 'from-green-500 to-green-600' },
  { id: 'sanskrit', name: 'Sanskrit', flag: '🕉️', color: 'from-amber-500 to-amber-600' },
  { id: 'japanese', name: 'Japanese', flag: '🇯🇵', color: 'from-red-500 to-red-600' },
  { id: 'french', name: 'French', flag: '🇫🇷', color: 'from-indigo-500 to-indigo-600' },
];

const lessonsData: Record<string, Lesson[]> = {
  english: [
    { id: 'e1', title: 'Basic Greetings', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 'e2', title: 'Common Phrases', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 'e3', title: 'Present Tense', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 'e4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
  hindi: [
    { id: 'h1', title: 'नमस्ते - Greetings', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 'h2', title: 'Basic Sentences', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 'h3', title: 'Gender Rules', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 'h4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
  marathi: [
    { id: 'm1', title: 'नमस्कार - Greetings', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 'm2', title: 'Basic Phrases', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 'm3', title: 'Verb Forms', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 'm4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
  sanskrit: [
    { id: 's1', title: 'नमः - Salutations', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 's2', title: 'Simple Sentences', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 's3', title: 'Vibhakti', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 's4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
  japanese: [
    { id: 'j1', title: 'こんにちは - Greetings', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 'j2', title: 'Hiragana Basics', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 'j3', title: 'Particles は/が', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 'j4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
  french: [
    { id: 'f1', title: 'Bonjour - Greetings', type: 'vocabulary', difficulty: 1, xp: 10, completed: false },
    { id: 'f2', title: 'Common Phrases', type: 'sentences', difficulty: 1, xp: 15, completed: false },
    { id: 'f3', title: 'Gender & Articles', type: 'grammar', difficulty: 2, xp: 20, completed: false },
    { id: 'f4', title: 'Daily Quiz', type: 'quiz', difficulty: 2, xp: 25, completed: false },
  ],
};

const questionsData: Record<string, Question[]> = {
  english: [
    { id: 'eq1', type: 'multiple-choice', question: 'How do you say "Hello"?', options: ['Hello', 'Goodbye', 'Thanks', 'Sorry'], answer: 'Hello', difficulty: 'easy' },
    { id: 'eq2', type: 'translation', question: 'Translate: Good morning', options: ['Good morning', 'Good night', 'Good evening', 'Good day'], answer: 'Good morning', difficulty: 'easy' },
    { id: 'eq3', type: 'fill-blank', question: 'Nice to ___ you!', options: ['meet', 'see', 'know', 'have'], answer: 'meet', difficulty: 'easy' },
    { id: 'eq4', type: 'meaning', question: 'What is the meaning of "Eloquent"?', options: ['Fluent and persuasive in speaking', 'Very loud', 'Extremely quiet', 'Fast moving'], answer: 'Fluent and persuasive in speaking', difficulty: 'medium' },
    { id: 'eq5', type: 'hard', question: 'Which sentence uses the subjunctive mood correctly?', options: ['If I were you, I would study harder', 'If I was you, I would study harder', 'If I am you, I would study harder', 'If I be you, I would study harder'], answer: 'If I were you, I would study harder', difficulty: 'hard' },
    { id: 'eq6', type: 'meaning', question: 'What does "Ubiquitous" mean?', options: ['Present everywhere', 'Very rare', 'Extremely small', 'Very old'], answer: 'Present everywhere', difficulty: 'hard' },
  ],
  hindi: [
    { id: 'hq1', type: 'multiple-choice', question: 'How do you say "Hello" in Hindi?', options: ['नमस्ते (Namaste)', 'धन्यवाद (Dhanyavaad)', 'अलविदा (Alvida)', 'माफ़ करें (Maaf karein)'], answer: 'नमस्ते (Namaste)', pronunciation: 'Namaste', difficulty: 'easy' },
    { id: 'hq2', type: 'translation', question: 'What does "धन्यवाद" mean?', options: ['Thank you', 'Sorry', 'Hello', 'Goodbye'], answer: 'Thank you', difficulty: 'easy' },
    { id: 'hq3', type: 'fill-blank', question: 'मेरा ___ राम है। (My name is Ram)', options: ['नाम (naam)', 'घर (ghar)', 'काम (kaam)', 'दोस्त (dost)'], answer: 'नाम (naam)', difficulty: 'easy' },
    { id: 'hq4', type: 'meaning', question: 'What is the meaning of "अद्भुत" (Adbhut)?', options: ['Wonderful/Amazing', 'Terrible', 'Normal', 'Boring'], answer: 'Wonderful/Amazing', difficulty: 'medium' },
    { id: 'hq5', type: 'hard', question: 'Complete: "जब तक सूरज चाँद रहेगा, ___"', options: ['आप का नाम रहेगा', 'आप खुश रहेंगे', 'वो आएगा', 'वो जाएगा'], answer: 'आप का नाम रहेगा', difficulty: 'hard' },
  ],
  marathi: [
    { id: 'mq1', type: 'multiple-choice', question: 'How do you say "Hello" in Marathi?', options: ['नमस्कार (Namaskar)', 'धन्यवाद (Dhanyavaad)', 'पुन्हा भेटू (Punha bhetu)', 'माफ करा (Maaf kara)'], answer: 'नमस्कार (Namaskar)', pronunciation: 'Namaskar', difficulty: 'easy' },
    { id: 'mq2', type: 'translation', question: 'What does "तुम्ही कसे आहात?" mean?', options: ['How are you?', 'What is your name?', 'Where are you going?', 'Goodbye'], answer: 'How are you?', difficulty: 'easy' },
    { id: 'mq3', type: 'meaning', question: 'What is the meaning of "सुंदर" (Sundar)?', options: ['Beautiful', 'Ugly', 'Fast', 'Slow'], answer: 'Beautiful', difficulty: 'medium' },
    { id: 'mq4', type: 'hard', question: 'Which is correct Marathi grammar?', options: ['मी मराठी बोलतो', 'मी मराठी बोलतो आहे', 'मी बोलतो मराठी', 'बोलतो मी मराठी'], answer: 'मी मराठी बोलतो', difficulty: 'hard' },
  ],
  sanskrit: [
    { id: 'sq1', type: 'multiple-choice', question: 'How do you say "Salutations" in Sanskrit?', options: ['नमः (Namaḥ)', 'कथम् (Katham)', 'अस्तु (Astu)', 'भवतु (Bhavatu)'], answer: 'नमः (Namaḥ)', pronunciation: 'Namaḥ', difficulty: 'easy' },
    { id: 'sq2', type: 'translation', question: 'What does "अहम्" mean?', options: ['I', 'You', 'He', 'We'], answer: 'I', difficulty: 'easy' },
    { id: 'sq3', type: 'meaning', question: 'What is the meaning of "विद्या" (Vidyā)?', options: ['Knowledge/Learning', 'Power', 'Money', 'Land'], answer: 'Knowledge/Learning', difficulty: 'medium' },
    { id: 'sq4', type: 'hard', question: 'What is the first person singular of "गम्" (to go)?', options: ['गच्छामि', 'गच्छति', 'गच्छसि', 'गच्छन्ति'], answer: 'गच्छामि', difficulty: 'hard' },
  ],
  japanese: [
    { id: 'jq1', type: 'multiple-choice', question: 'How do you say "Hello" in Japanese?', options: ['こんにちは (Konnichiwa)', 'さようなら (Sayounara)', 'ありがとう (Arigatou)', 'すみません (Sumimasen)'], answer: 'こんにちは (Konnichiwa)', pronunciation: 'Konnichiwa', difficulty: 'easy' },
    { id: 'jq2', type: 'translation', question: 'What does "ありがとう" mean?', options: ['Thank you', 'Sorry', 'Hello', 'Goodbye'], answer: 'Thank you', difficulty: 'easy' },
    { id: 'jq3', type: 'fill-blank', question: '私___名前は田中です。(My name is Tanaka)', options: ['の (no)', 'は (wa)', 'が (ga)', 'を (wo)'], answer: 'の (no)', difficulty: 'easy' },
    { id: 'jq4', type: 'meaning', question: 'What is the meaning of "美しい" (Utsukushii)?', options: ['Beautiful', 'Ugly', 'Fast', 'Slow'], answer: 'Beautiful', difficulty: 'medium' },
    { id: 'jq5', type: 'hard', question: 'Which particle indicates the topic of a sentence?', options: ['は (wa)', 'が (ga)', 'を (wo)', 'に (ni)'], answer: 'は (wa)', difficulty: 'hard' },
    { id: 'jq6', type: 'hard', question: 'What is the て-form of 食べる (taberu)?', options: ['食べて', '食べた', '食べない', '食べます'], answer: '食べて', difficulty: 'hard' },
  ],
  french: [
    { id: 'fq1', type: 'multiple-choice', question: 'How do you say "Hello" in French?', options: ['Bonjour', 'Au revoir', 'Merci', 'Pardon'], answer: 'Bonjour', difficulty: 'easy' },
    { id: 'fq2', type: 'translation', question: 'What does "Merci beaucoup" mean?', options: ['Thank you very much', 'Goodbye', 'See you later', 'Excuse me'], answer: 'Thank you very much', difficulty: 'easy' },
    { id: 'fq3', type: 'fill-blank', question: 'Je ___ français. (I speak French)', options: ['parle', 'mange', 'bois', 'vais'], answer: 'parle', difficulty: 'easy' },
    { id: 'fq4', type: 'meaning', question: 'What is the meaning of "magnifique"?', options: ['Magnificent/Wonderful', 'Terrible', 'Normal', 'Small'], answer: 'Magnificent/Wonderful', difficulty: 'medium' },
    { id: 'fq5', type: 'hard', question: 'What is the passé composé of "aller" (to go) for "je"?', options: ['je suis allé(e)', 'j\'ai allé', 'je vais allé', 'j\'allais'], answer: 'je suis allé(e)', difficulty: 'hard' },
    { id: 'fq6', type: 'hard', question: 'Which is the correct subjunctive form?', options: ['Il faut que je fasse', 'Il faut que je fais', 'Il faut que je faire', 'Il faut que je fait'], answer: 'Il faut que je fasse', difficulty: 'hard' },
  ],
};

export default function LanguageLearning() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [dailyProgress, setDailyProgress] = useState(0);
  const [hearts, setHearts] = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem('language-learning-progress');
    if (saved) {
      const data = JSON.parse(saved);
      setTotalXP(data.totalXP || 0);
      setStreak(data.streak || 0);
      setCompletedLessons(data.completedLessons || []);
      setDailyProgress(data.dailyProgress || 0);
    }
  }, []);

  const saveProgress = (xp: number, lessons: string[], progress: number) => {
    const data = { totalXP: xp, streak, completedLessons: lessons, dailyProgress: progress };
    localStorage.setItem('language-learning-progress', JSON.stringify(data));
  };

  const speakText = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text.split('(')[0].trim());
    const langCodes: Record<string, string> = {
      english: 'en-US', hindi: 'hi-IN', marathi: 'mr-IN',
      sanskrit: 'sa-IN', japanese: 'ja-JP', french: 'fr-FR'
    };
    utterance.lang = langCodes[lang] || 'en-US';
    speechSynthesis.speak(utterance);
  };

  const handleAnswerSelect = (answer: string) => {
    if (isAnswerRevealed) return;
    setSelectedAnswer(answer);
  };

  const checkAnswer = () => {
    if (!selectedAnswer || !selectedLanguage) return;
    
    const questions = questionsData[selectedLanguage.id] || [];
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    setIsAnswerRevealed(true);
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      toast({ title: 'Correct! 🎉', description: '+10 XP' });
    } else {
      setHearts(prev => Math.max(0, prev - 1));
      toast({ title: 'Incorrect 😔', description: `The answer was: ${currentQuestion.answer}`, variant: 'destructive' });
    }
  };

  const nextQuestion = () => {
    if (!selectedLanguage) return;
    
    const questions = questionsData[selectedLanguage.id] || [];
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      // Lesson complete
      const earnedXP = score + 10;
      const newTotalXP = totalXP + earnedXP;
      const newProgress = Math.min(100, dailyProgress + 25);
      const newCompletedLessons = currentLesson 
        ? [...completedLessons, currentLesson.id]
        : completedLessons;
      
      setTotalXP(newTotalXP);
      setDailyProgress(newProgress);
      setCompletedLessons(newCompletedLessons);
      saveProgress(newTotalXP, newCompletedLessons, newProgress);
      
      toast({
        title: 'Lesson Complete! 🏆',
        description: `You earned ${earnedXP} XP!`
      });
      
      setCurrentLesson(null);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setHearts(5);
    }
  };

  const startLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setHearts(5);
  };

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="h-5 w-5 mr-2" />
              Home
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full">
                <Flame className="h-5 w-5 text-amber-500" />
                <span className="font-bold text-amber-500">{streak} day streak</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-bold text-primary">{totalXP} XP</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              Learn Languages
            </h1>
            <p className="text-lg text-muted-foreground">Choose a language to start learning</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {languages.map((lang) => (
              <Card 
                key={lang.id}
                className="cursor-pointer hover:scale-105 transition-all duration-300 overflow-hidden group"
                onClick={() => setSelectedLanguage(lang)}
              >
                <div className={`h-2 bg-gradient-to-r ${lang.color}`} />
                <CardContent className="p-6 text-center">
                  <div className="text-5xl mb-3">{lang.flag}</div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {lang.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Daily Progress */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Today's goal</span>
                  <span>{dailyProgress}%</span>
                </div>
                <Progress value={dailyProgress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Lesson/Quiz Screen
  if (currentLesson) {
    const questions = questionsData[selectedLanguage.id] || [];
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto text-amber-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No questions available</h2>
            <Button onClick={() => setCurrentLesson(null)}>Back to Lessons</Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setCurrentLesson(null)}>
              ✕
            </Button>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="w-48 h-3" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < hearts ? 'text-red-500' : 'text-gray-300'}>❤️</span>
              ))}
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currentQuestion.type}</Badge>
                  {currentQuestion.difficulty && (
                    <Badge 
                      variant={currentQuestion.difficulty === 'easy' ? 'default' : currentQuestion.difficulty === 'hard' ? 'destructive' : 'secondary'}
                      className={
                        currentQuestion.difficulty === 'easy' ? 'bg-green-500' :
                        currentQuestion.difficulty === 'hard' ? 'bg-red-500' :
                        'bg-amber-500'
                      }
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => speakText(currentQuestion.question, selectedLanguage.id)}>
                  <Volume2 className="h-5 w-5" />
                </Button>
              </div>

              <h2 className="text-2xl font-bold mb-8 text-center">{currentQuestion.question}</h2>

              {currentQuestion.pronunciation && (
                <p className="text-center text-muted-foreground mb-4 italic">
                  Pronunciation: {currentQuestion.pronunciation}
                </p>
              )}

              <div className="grid gap-3">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option}
                    variant={
                      isAnswerRevealed
                        ? option === currentQuestion.answer
                          ? 'default'
                          : option === selectedAnswer
                            ? 'destructive'
                            : 'outline'
                        : selectedAnswer === option
                          ? 'secondary'
                          : 'outline'
                    }
                    className={`p-6 text-lg h-auto justify-start transition-all ${
                      isAnswerRevealed && option === currentQuestion.answer 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                        : ''
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswerRevealed}
                  >
                    <span className="flex items-center gap-3">
                      {isAnswerRevealed && option === currentQuestion.answer && (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                      {isAnswerRevealed && option === selectedAnswer && option !== currentQuestion.answer && (
                        <XCircle className="h-5 w-5" />
                      )}
                      {option}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            className="w-full py-6 text-lg"
            onClick={isAnswerRevealed ? nextQuestion : checkAnswer}
            disabled={!selectedAnswer && !isAnswerRevealed}
          >
            {isAnswerRevealed ? (
              <>
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              'Check Answer'
            )}
          </Button>

          {/* Score */}
          <div className="mt-4 text-center">
            <span className="text-muted-foreground">Score: </span>
            <span className="font-bold text-primary">{score} XP</span>
          </div>
        </div>
      </div>
    );
  }

  // Lessons List Screen
  const lessons = lessonsData[selectedLanguage.id] || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setSelectedLanguage(null)}>
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedLanguage.flag}</span>
            <h1 className="text-2xl font-bold">{selectedLanguage.name}</h1>
          </div>
          <div className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-full">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">{totalXP} XP</span>
          </div>
        </div>

        {/* Daily Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Daily Goal</span>
              <span className="text-sm text-muted-foreground">{dailyProgress}% complete</span>
            </div>
            <Progress value={dailyProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="lessons" className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="mt-4">
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Card 
                  key={lesson.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    completedLessons.includes(lesson.id) ? 'border-green-500/50 bg-green-500/5' : ''
                  }`}
                  onClick={() => startLesson(lesson)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      completedLessons.includes(lesson.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {completedLessons.includes(lesson.id) ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                        <span>+{lesson.xp} XP</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Quick Practice</h3>
                <p className="text-muted-foreground mb-4">
                  Review words and phrases you've learned
                </p>
                <Button onClick={() => startLesson(lessons[0])}>
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className={totalXP >= 50 ? 'border-amber-500/50' : 'opacity-50'}>
                <CardContent className="p-4 text-center">
                  <Award className={`h-12 w-12 mx-auto mb-2 ${totalXP >= 50 ? 'text-amber-500' : 'text-muted'}`} />
                  <h4 className="font-semibold">First Steps</h4>
                  <p className="text-xs text-muted-foreground">Earn 50 XP</p>
                </CardContent>
              </Card>
              <Card className={completedLessons.length >= 5 ? 'border-amber-500/50' : 'opacity-50'}>
                <CardContent className="p-4 text-center">
                  <Trophy className={`h-12 w-12 mx-auto mb-2 ${completedLessons.length >= 5 ? 'text-amber-500' : 'text-muted'}`} />
                  <h4 className="font-semibold">Dedicated</h4>
                  <p className="text-xs text-muted-foreground">Complete 5 lessons</p>
                </CardContent>
              </Card>
              <Card className={streak >= 7 ? 'border-amber-500/50' : 'opacity-50'}>
                <CardContent className="p-4 text-center">
                  <Flame className={`h-12 w-12 mx-auto mb-2 ${streak >= 7 ? 'text-amber-500' : 'text-muted'}`} />
                  <h4 className="font-semibold">On Fire</h4>
                  <p className="text-xs text-muted-foreground">7 day streak</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
