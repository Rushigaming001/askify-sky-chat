import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Trophy, Flame, Star, CheckCircle2, XCircle, 
  Volume2, ArrowRight, Home, Target, Award, Zap, Music, Play, Sparkles, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  options: string[];
  answer: string;
  pronunciation?: string;
  audio?: string;
  difficulty: 'easy' | 'medium' | 'hard';
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
    { id: 'e1', title: 'Vocabulary Mastery', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 'e2', title: 'Advanced Grammar', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 'e3', title: 'Idioms & Expressions', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 'e4', title: 'Expert Challenge', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
  hindi: [
    { id: 'h1', title: 'शब्दावली - Vocabulary', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 'h2', title: 'वाक्य रचना - Sentences', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 'h3', title: 'व्याकरण - Grammar', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 'h4', title: 'विशेषज्ञ परीक्षा', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
  marathi: [
    { id: 'm1', title: 'शब्दसंग्रह', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 'm2', title: 'वाक्यरचना', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 'm3', title: 'व्याकरण नियम', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 'm4', title: 'तज्ञ परीक्षा', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
  sanskrit: [
    { id: 's1', title: 'शब्दकोशः', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 's2', title: 'वाक्यरचना', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 's3', title: 'विभक्ति ज्ञानम्', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 's4', title: 'विशेषज्ञ परीक्षा', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
  japanese: [
    { id: 'j1', title: '語彙 - Vocabulary', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 'j2', title: '文法 - Grammar', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 'j3', title: '敬語 - Honorifics', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 'j4', title: 'エキスパート', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
  french: [
    { id: 'f1', title: 'Vocabulaire', type: 'vocabulary', difficulty: 1, xp: 15, completed: false },
    { id: 'f2', title: 'Grammaire Avancée', type: 'sentences', difficulty: 2, xp: 20, completed: false },
    { id: 'f3', title: 'Expressions Idiomatiques', type: 'grammar', difficulty: 2, xp: 25, completed: false },
    { id: 'f4', title: 'Défi Expert', type: 'quiz', difficulty: 3, xp: 35, completed: false },
  ],
};

// Comprehensive question banks with proper difficulty and 4 options each
const questionsData: Record<string, Question[]> = {
  english: [
    // Easy
    { id: 'eq1', type: 'meaning', question: 'What does "benevolent" mean?', options: ['Kind and generous', 'Evil and cruel', 'Lazy and slow', 'Loud and noisy'], answer: 'Kind and generous', difficulty: 'easy' },
    { id: 'eq2', type: 'fill-blank', question: 'She ___ her homework before dinner.', options: ['completed', 'completing', 'complete', 'completes'], answer: 'completed', difficulty: 'easy' },
    { id: 'eq3', type: 'translation', question: 'Choose the correct past tense: "He ___ to the store yesterday."', options: ['went', 'goed', 'goes', 'going'], answer: 'went', difficulty: 'easy' },
    // Medium
    { id: 'eq4', type: 'meaning', question: 'What is the meaning of "ephemeral"?', options: ['Lasting for a very short time', 'Permanent and eternal', 'Very large in size', 'Extremely valuable'], answer: 'Lasting for a very short time', difficulty: 'medium' },
    { id: 'eq5', type: 'meaning', question: 'What does "ubiquitous" mean?', options: ['Present everywhere at once', 'Very rare and uncommon', 'Extremely expensive', 'Ancient and outdated'], answer: 'Present everywhere at once', difficulty: 'medium' },
    { id: 'eq6', type: 'fill-blank', question: 'Neither the teacher ___ the students were happy.', options: ['nor', 'or', 'and', 'but'], answer: 'nor', difficulty: 'medium' },
    { id: 'eq7', type: 'meaning', question: 'What is the meaning of "pragmatic"?', options: ['Dealing with things sensibly and realistically', 'Idealistic and dreamy', 'Pessimistic and negative', 'Artistic and creative'], answer: 'Dealing with things sensibly and realistically', difficulty: 'medium' },
    // Hard
    { id: 'eq8', type: 'hard', question: 'Which sentence uses the subjunctive mood correctly?', options: ['If I were you, I would reconsider', 'If I was you, I would reconsider', 'If I am you, I would reconsider', 'If I be you, I would reconsider'], answer: 'If I were you, I would reconsider', difficulty: 'hard' },
    { id: 'eq9', type: 'hard', question: 'What does "perspicacious" mean?', options: ['Having keen mental perception and understanding', 'Being extremely stubborn', 'Having poor eyesight', 'Being overly generous'], answer: 'Having keen mental perception and understanding', difficulty: 'hard' },
    { id: 'eq10', type: 'hard', question: 'Identify the correct use of "whom":', options: ['To whom did you give the book?', 'Whom is going to the party?', 'Whom wrote this letter?', 'Whom are you?'], answer: 'To whom did you give the book?', difficulty: 'hard' },
    { id: 'eq11', type: 'hard', question: 'What is the meaning of "obfuscate"?', options: ['To make unclear or confusing', 'To clarify and explain', 'To illuminate brightly', 'To move quickly'], answer: 'To make unclear or confusing', difficulty: 'hard' },
    { id: 'eq12', type: 'hard', question: 'Which sentence demonstrates correct parallel structure?', options: ['She likes hiking, swimming, and to read', 'She likes hiking, swimming, and reading', 'She likes to hike, swimming, and reading', 'She likes hike, swim, and read'], answer: 'She likes hiking, swimming, and reading', difficulty: 'hard' },
    { id: 'eq13', type: 'hard', question: 'What does "verisimilitude" mean?', options: ['The appearance of being true or real', 'The quality of being false', 'Extreme beauty', 'Great intelligence'], answer: 'The appearance of being true or real', difficulty: 'hard' },
    { id: 'eq14', type: 'hard', question: 'Identify the dangling modifier:', options: ['Walking down the street, the rain began to fall', 'Walking down the street, I noticed the rain', 'I was walking when the rain started', 'The rain fell as I walked'], answer: 'Walking down the street, the rain began to fall', difficulty: 'hard' },
    { id: 'eq15', type: 'hard', question: 'What is the meaning of "sycophant"?', options: ['A person who flatters for personal gain', 'A brave warrior', 'A wise teacher', 'An honest politician'], answer: 'A person who flatters for personal gain', difficulty: 'hard' },
  ],
  hindi: [
    // Easy
    { id: 'hq1', type: 'translation', question: 'What does "धन्यवाद" (Dhanyavaad) mean?', options: ['Thank you', 'Sorry', 'Please', 'Welcome'], answer: 'Thank you', pronunciation: 'Dhanyavaad', difficulty: 'easy' },
    { id: 'hq2', type: 'fill-blank', question: 'मेरा ___ राम है। (My name is Ram)', options: ['नाम', 'घर', 'काम', 'देश'], answer: 'नाम', difficulty: 'easy' },
    { id: 'hq3', type: 'meaning', question: 'What is the meaning of "सुंदर" (Sundar)?', options: ['Beautiful', 'Ugly', 'Fast', 'Slow'], answer: 'Beautiful', difficulty: 'easy' },
    // Medium
    { id: 'hq4', type: 'meaning', question: 'What does "अद्भुत" (Adbhut) mean?', options: ['Wonderful/Amazing', 'Terrible', 'Normal', 'Boring'], answer: 'Wonderful/Amazing', difficulty: 'medium' },
    { id: 'hq5', type: 'fill-blank', question: 'वह बहुत ___ लड़का है। (He is a very smart boy)', options: ['होशियार', 'मूर्ख', 'बड़ा', 'छोटा'], answer: 'होशियार', difficulty: 'medium' },
    { id: 'hq6', type: 'meaning', question: 'What is the meaning of "विद्वान" (Vidwaan)?', options: ['Scholar/Learned person', 'Fool', 'King', 'Soldier'], answer: 'Scholar/Learned person', difficulty: 'medium' },
    // Hard
    { id: 'hq7', type: 'hard', question: 'Complete the proverb: "जब तक सूरज चाँद रहेगा, ___"', options: ['आपका नाम रहेगा', 'बारिश होगी', 'अंधेरा रहेगा', 'गर्मी रहेगी'], answer: 'आपका नाम रहेगा', difficulty: 'hard' },
    { id: 'hq8', type: 'hard', question: 'What is the Sanskrit-derived Hindi word for "knowledge"?', options: ['ज्ञान (Gyaan)', 'पानी (Paani)', 'खाना (Khaana)', 'सोना (Sona)'], answer: 'ज्ञान (Gyaan)', difficulty: 'hard' },
    { id: 'hq9', type: 'hard', question: 'Which is the correct causative form of "पढ़ना" (to read)?', options: ['पढ़ाना (to teach)', 'पढ़ना (to read)', 'पढ़ (read)', 'पढ़ी (read past)'], answer: 'पढ़ाना (to teach)', difficulty: 'hard' },
    { id: 'hq10', type: 'hard', question: 'What does "निःस्वार्थ" (Nihswarth) mean?', options: ['Selfless', 'Selfish', 'Lazy', 'Greedy'], answer: 'Selfless', difficulty: 'hard' },
    { id: 'hq11', type: 'hard', question: 'Complete: "अंधों में काना ___"', options: ['राजा', 'मूर्ख', 'गरीब', 'अमीर'], answer: 'राजा', difficulty: 'hard' },
    { id: 'hq12', type: 'hard', question: 'What is the meaning of "परोपकार" (Paropkaar)?', options: ['Helping others', 'Self-help', 'Destruction', 'Creation'], answer: 'Helping others', difficulty: 'hard' },
  ],
  marathi: [
    // Easy
    { id: 'mq1', type: 'translation', question: 'What does "कसे आहात?" mean?', options: ['How are you?', 'What is your name?', 'Where are you going?', 'Goodbye'], answer: 'How are you?', difficulty: 'easy' },
    { id: 'mq2', type: 'meaning', question: 'What is the meaning of "आनंद" (Aanand)?', options: ['Happiness/Joy', 'Sadness', 'Anger', 'Fear'], answer: 'Happiness/Joy', difficulty: 'easy' },
    // Medium
    { id: 'mq3', type: 'fill-blank', question: 'मी मराठी ___. (I speak Marathi)', options: ['बोलतो/बोलते', 'खातो', 'जातो', 'येतो'], answer: 'बोलतो/बोलते', difficulty: 'medium' },
    { id: 'mq4', type: 'meaning', question: 'What does "सुंदर" (Sundar) mean?', options: ['Beautiful', 'Ugly', 'Tall', 'Short'], answer: 'Beautiful', difficulty: 'medium' },
    // Hard
    { id: 'mq5', type: 'hard', question: 'Which is correct Marathi grammar for "I am going"?', options: ['मी जातो/जाते आहे', 'मी जात आहे', 'मी जाणार', 'मी गेलो'], answer: 'मी जातो/जाते आहे', difficulty: 'hard' },
    { id: 'mq6', type: 'hard', question: 'What is the meaning of "विद्या" (Vidya)?', options: ['Knowledge/Education', 'Money', 'Power', 'Food'], answer: 'Knowledge/Education', difficulty: 'hard' },
    { id: 'mq7', type: 'hard', question: 'Complete the proverb: "करावे तसे ___"', options: ['भरावे', 'खावे', 'जावे', 'यावे'], answer: 'भरावे', difficulty: 'hard' },
    { id: 'mq8', type: 'hard', question: 'What does "निःस्वार्थ" mean in Marathi?', options: ['Selfless', 'Selfish', 'Angry', 'Happy'], answer: 'Selfless', difficulty: 'hard' },
  ],
  sanskrit: [
    // Easy
    { id: 'sq1', type: 'translation', question: 'What does "अहम्" (Aham) mean?', options: ['I', 'You', 'He', 'We'], answer: 'I', difficulty: 'easy' },
    { id: 'sq2', type: 'meaning', question: 'What is the meaning of "विद्या" (Vidyā)?', options: ['Knowledge/Learning', 'Power', 'Money', 'Land'], answer: 'Knowledge/Learning', difficulty: 'easy' },
    // Medium
    { id: 'sq3', type: 'fill-blank', question: 'राम: ___ गच्छति। (Ram goes to school)', options: ['विद्यालयम्', 'गृहम्', 'वनम्', 'नगरम्'], answer: 'विद्यालयम्', difficulty: 'medium' },
    { id: 'sq4', type: 'meaning', question: 'What does "सत्यम्" (Satyam) mean?', options: ['Truth', 'Lie', 'Dream', 'Story'], answer: 'Truth', difficulty: 'medium' },
    // Hard
    { id: 'sq5', type: 'hard', question: 'What is the first person singular of "गम्" (to go)?', options: ['गच्छामि', 'गच्छति', 'गच्छसि', 'गच्छन्ति'], answer: 'गच्छामि', difficulty: 'hard' },
    { id: 'sq6', type: 'hard', question: 'Which vibhakti (case) indicates "from"?', options: ['Panchami (5th)', 'Prathamā (1st)', 'Dvitīyā (2nd)', 'Chaturthi (4th)'], answer: 'Panchami (5th)', difficulty: 'hard' },
    { id: 'sq7', type: 'hard', question: 'What is the dual form of "बालक:" (boy)?', options: ['बालकौ', 'बालका:', 'बालकम्', 'बालकेन'], answer: 'बालकौ', difficulty: 'hard' },
    { id: 'sq8', type: 'hard', question: 'Complete: "विद्या ददाति ___" (Knowledge gives...)', options: ['विनयम्', 'धनम्', 'बलम्', 'सुखम्'], answer: 'विनयम्', difficulty: 'hard' },
  ],
  japanese: [
    // Easy
    { id: 'jq1', type: 'translation', question: 'What does "ありがとう" (Arigatou) mean?', options: ['Thank you', 'Sorry', 'Hello', 'Goodbye'], answer: 'Thank you', pronunciation: 'Arigatou', difficulty: 'easy' },
    { id: 'jq2', type: 'meaning', question: 'What is "食べる" (Taberu)?', options: ['To eat', 'To drink', 'To sleep', 'To walk'], answer: 'To eat', difficulty: 'easy' },
    // Medium
    { id: 'jq3', type: 'fill-blank', question: '私___ 名前は田中です。(My name is Tanaka)', options: ['の', 'は', 'が', 'を'], answer: 'の', difficulty: 'medium' },
    { id: 'jq4', type: 'meaning', question: 'What does "美しい" (Utsukushii) mean?', options: ['Beautiful', 'Ugly', 'Fast', 'Slow'], answer: 'Beautiful', difficulty: 'medium' },
    { id: 'jq5', type: 'fill-blank', question: '本___ 読みます。(I read a book)', options: ['を', 'は', 'が', 'に'], answer: 'を', difficulty: 'medium' },
    // Hard
    { id: 'jq6', type: 'hard', question: 'Which particle indicates the topic of a sentence?', options: ['は (wa)', 'が (ga)', 'を (wo)', 'に (ni)'], answer: 'は (wa)', difficulty: 'hard' },
    { id: 'jq7', type: 'hard', question: 'What is the て-form of 食べる (taberu)?', options: ['食べて', '食べた', '食べない', '食べます'], answer: '食べて', difficulty: 'hard' },
    { id: 'jq8', type: 'hard', question: 'Which is the correct keigo (polite) form of "言う" (to say)?', options: ['おっしゃる', '言った', '言います', '言って'], answer: 'おっしゃる', difficulty: 'hard' },
    { id: 'jq9', type: 'hard', question: 'What does "一期一会" (Ichigo Ichie) mean?', options: ['Once in a lifetime encounter', 'One plus one equals two', 'First meeting', 'Last goodbye'], answer: 'Once in a lifetime encounter', difficulty: 'hard' },
    { id: 'jq10', type: 'hard', question: 'What is the passive form of 見る (miru)?', options: ['見られる', '見させる', '見える', '見た'], answer: '見られる', difficulty: 'hard' },
    { id: 'jq11', type: 'hard', question: 'Which counter is used for flat objects?', options: ['枚 (mai)', '個 (ko)', '本 (hon)', '匹 (hiki)'], answer: '枚 (mai)', difficulty: 'hard' },
  ],
  french: [
    // Easy
    { id: 'fq1', type: 'translation', question: 'What does "Merci beaucoup" mean?', options: ['Thank you very much', 'Goodbye', 'See you later', 'Excuse me'], answer: 'Thank you very much', difficulty: 'easy' },
    { id: 'fq2', type: 'meaning', question: 'What is "manger"?', options: ['To eat', 'To drink', 'To walk', 'To sleep'], answer: 'To eat', difficulty: 'easy' },
    // Medium
    { id: 'fq3', type: 'fill-blank', question: 'Je ___ français. (I speak French)', options: ['parle', 'mange', 'bois', 'vais'], answer: 'parle', difficulty: 'medium' },
    { id: 'fq4', type: 'meaning', question: 'What does "magnifique" mean?', options: ['Magnificent/Wonderful', 'Terrible', 'Normal', 'Small'], answer: 'Magnificent/Wonderful', difficulty: 'medium' },
    { id: 'fq5', type: 'fill-blank', question: 'Elle ___ une pomme. (She eats an apple)', options: ['mange', 'boit', 'dort', 'court'], answer: 'mange', difficulty: 'medium' },
    // Hard
    { id: 'fq6', type: 'hard', question: 'What is the passé composé of "aller" for "je"?', options: ['je suis allé(e)', "j'ai allé", 'je vais allé', "j'allais"], answer: 'je suis allé(e)', difficulty: 'hard' },
    { id: 'fq7', type: 'hard', question: 'Which is the correct subjunctive form?', options: ['Il faut que je fasse', 'Il faut que je fais', 'Il faut que je faire', 'Il faut que je fait'], answer: 'Il faut que je fasse', difficulty: 'hard' },
    { id: 'fq8', type: 'hard', question: 'What does "avoir le cafard" mean?', options: ['To feel depressed', 'To have a cockroach', 'To drink coffee', 'To be angry'], answer: 'To feel depressed', difficulty: 'hard' },
    { id: 'fq9', type: 'hard', question: 'Which verb uses "être" as auxiliary in passé composé?', options: ['aller (to go)', 'manger (to eat)', 'boire (to drink)', 'lire (to read)'], answer: 'aller (to go)', difficulty: 'hard' },
    { id: 'fq10', type: 'hard', question: 'What is the imparfait of "être" for "nous"?', options: ['nous étions', 'nous sommes', 'nous avions', 'nous allions'], answer: 'nous étions', difficulty: 'hard' },
    { id: 'fq11', type: 'hard', question: 'What does "il pleut des cordes" mean?', options: ['It is raining heavily', 'There are ropes falling', 'The wind is strong', 'The sun is shining'], answer: 'It is raining heavily', difficulty: 'hard' },
  ],
};

// Generate unlimited hard questions dynamically
const generateHardQuestion = (langId: string, index: number): Question => {
  const hardQuestionTemplates: Record<string, Question[]> = {
    english: [
      { id: `gen_eq_${index}`, type: 'hard', question: 'What is the meaning of "sesquipedalian"?', options: ['Using long words', 'Being short', 'Running fast', 'Eating slowly'], answer: 'Using long words', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What does "defenestration" mean?', options: ['Throwing someone out of a window', 'Building a fence', 'Defending a position', 'Celebrating victory'], answer: 'Throwing someone out of a window', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What is the meaning of "pulchritudinous"?', options: ['Beautiful', 'Ugly', 'Intelligent', 'Strong'], answer: 'Beautiful', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What does "loquacious" mean?', options: ['Very talkative', 'Very quiet', 'Very tall', 'Very smart'], answer: 'Very talkative', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What is "antidisestablishmentarianism"?', options: ['Opposition to church-state separation', 'Support for democracy', 'A type of medicine', 'A dance style'], answer: 'Opposition to church-state separation', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What does "supercilious" mean?', options: ['Behaving as if superior', 'Being very kind', 'Moving quickly', 'Eating excessively'], answer: 'Behaving as if superior', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What is the meaning of "callipygian"?', options: ['Having shapely buttocks', 'Being very tall', 'Having good handwriting', 'Being musical'], answer: 'Having shapely buttocks', difficulty: 'hard' },
      { id: `gen_eq_${index}`, type: 'hard', question: 'What does "quixotic" mean?', options: ['Idealistic and impractical', 'Practical and efficient', 'Quick and fast', 'Quiet and peaceful'], answer: 'Idealistic and impractical', difficulty: 'hard' },
    ],
    hindi: [
      { id: `gen_hq_${index}`, type: 'hard', question: 'What is "अविनाशी" (Avinaashi)?', options: ['Indestructible', 'Destructible', 'Beautiful', 'Ugly'], answer: 'Indestructible', difficulty: 'hard' },
      { id: `gen_hq_${index}`, type: 'hard', question: 'Complete: "नाच न जाने ___"', options: ['आँगन टेढ़ा', 'घर अच्छा', 'मन खुश', 'दिल बड़ा'], answer: 'आँगन टेढ़ा', difficulty: 'hard' },
    ],
    marathi: [
      { id: `gen_mq_${index}`, type: 'hard', question: 'What does "आत्मविश्वास" mean?', options: ['Self-confidence', 'Fear', 'Anger', 'Joy'], answer: 'Self-confidence', difficulty: 'hard' },
    ],
    sanskrit: [
      { id: `gen_sq_${index}`, type: 'hard', question: 'What is the locative singular of "राम"?', options: ['रामे', 'रामम्', 'रामेण', 'रामात्'], answer: 'रामे', difficulty: 'hard' },
    ],
    japanese: [
      { id: `gen_jq_${index}`, type: 'hard', question: 'What is the causative-passive of 食べる?', options: ['食べさせられる', '食べられる', '食べさせる', '食べている'], answer: '食べさせられる', difficulty: 'hard' },
    ],
    french: [
      { id: `gen_fq_${index}`, type: 'hard', question: 'What is the plus-que-parfait of "manger" for "il"?', options: ['il avait mangé', 'il a mangé', 'il mangeait', 'il mangera'], answer: 'il avait mangé', difficulty: 'hard' },
    ],
  };
  
  const templates = hardQuestionTemplates[langId] || hardQuestionTemplates.english;
  return { ...templates[index % templates.length], id: `gen_${langId}_${index}` };
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
  const [showDanceLearner, setShowDanceLearner] = useState(false);
  const [hardModeEnabled, setHardModeEnabled] = useState(false);
  const [generatedHardQuestions, setGeneratedHardQuestions] = useState<Question[]>([]);

  // Shuffle array helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate questions with shuffled options
  const allQuestions = useMemo(() => {
    if (!selectedLanguage) return [];
    const baseQuestions = questionsData[selectedLanguage.id] || [];
    
    // Shuffle options for each question while keeping track of correct answer
    const shuffleQuestion = (q: Question): Question => ({
      ...q,
      options: shuffleArray(q.options)
    });
    
    if (hardModeEnabled) {
      const extraHard = Array.from({ length: 20 }, (_, i) => 
        shuffleQuestion(generateHardQuestion(selectedLanguage.id, i))
      );
      return [...baseQuestions.map(shuffleQuestion), ...extraHard];
    }
    return baseQuestions.map(shuffleQuestion);
  }, [selectedLanguage, hardModeEnabled, currentQuestionIndex]);

  // AI Hint state
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  const getAIHint = async () => {
    if (!selectedLanguage || loadingHint) return;
    
    const currentQuestion = allQuestions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setLoadingHint(true);
    setAiHint(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('askify-chat', {
        body: { 
          message: `Give a brief, helpful hint (2-3 sentences max) for this ${selectedLanguage.name} language learning question WITHOUT revealing the answer directly. Just guide the student to think in the right direction.

Question: ${currentQuestion.question}
Options: ${currentQuestion.options.join(', ')}

Provide a subtle hint that helps understand the concept without giving away the answer.`
        }
      });

      if (error) throw error;
      setAiHint(data.response || 'Think about the context and meaning carefully!');
    } catch (error) {
      console.error('Error getting AI hint:', error);
      setAiHint('Focus on the key words in the question and eliminate obviously wrong options.');
    } finally {
      setLoadingHint(false);
    }
  };

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
    
    const currentQuestion = allQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    setIsAnswerRevealed(true);
    
    if (isCorrect) {
      const xpEarned = currentQuestion.difficulty === 'hard' ? 25 : currentQuestion.difficulty === 'medium' ? 15 : 10;
      setScore(prev => prev + xpEarned);
      toast({ title: 'Correct! 🎉', description: `+${xpEarned} XP` });
    } else {
      setHearts(prev => Math.max(0, prev - 1));
      toast({ title: 'Incorrect 😔', description: `The answer was: ${currentQuestion.answer}`, variant: 'destructive' });
    }
  };

  const nextQuestion = () => {
    if (!selectedLanguage) return;
    
    // In hard mode, generate unlimited questions
    if (hardModeEnabled || currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
      setAiHint(null);  // Clear AI hint for next question
      
      // Generate more questions if needed
      if (hardModeEnabled && currentQuestionIndex >= allQuestions.length - 5) {
        const newQuestions = Array.from({ length: 10 }, (_, i) => 
          generateHardQuestion(selectedLanguage.id, allQuestions.length + i)
        );
        setGeneratedHardQuestions(prev => [...prev, ...newQuestions]);
      }
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
      setHardModeEnabled(false);
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

  const startHardMode = () => {
    setHardModeEnabled(true);
    setCurrentLesson({ id: 'hard', title: 'Hard Mode Challenge', type: 'quiz', difficulty: 3, xp: 50, completed: false });
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswerRevealed(false);
    setHearts(3);
  };

  // Dance Learner Screen
  if (showDanceLearner) {
    return <DanceLearner onBack={() => setShowDanceLearner(false)} />;
  }

  // Language Selection Screen
  if (!selectedLanguage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="h-5 w-5 mr-2" />
              Home
            </Button>
            <div className="flex items-center gap-4 flex-wrap">
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
              Learn Languages & Dance
            </h1>
            <p className="text-lg text-muted-foreground">Choose a language or learn choreography</p>
          </div>

          {/* Dance Learner Card */}
          <Card 
            className="mb-8 cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden group border-2 border-pink-500/50"
            onClick={() => setShowDanceLearner(true)}
          >
            <div className="h-2 bg-gradient-to-r from-pink-500 to-purple-500" />
            <CardContent className="p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <Music className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">
                  💃 Dance Choreographer
                </h3>
                <p className="text-muted-foreground">Learn full dance routines step-by-step with video tutorials</p>
              </div>
              <ArrowRight className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Languages</h2>
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
                  <span>Today&apos;s goal</span>
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
    const currentQuestion = allQuestions[currentQuestionIndex] || generateHardQuestion(selectedLanguage.id, currentQuestionIndex);

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
            <Button variant="ghost" onClick={() => { setCurrentLesson(null); setHardModeEnabled(false); }}>
              ✕
            </Button>
            <div className="flex items-center gap-2">
              {hardModeEnabled && <Badge className="bg-red-500">HARD MODE ♾️</Badge>}
              <Progress value={hardModeEnabled ? 100 : (currentQuestionIndex / allQuestions.length) * 100} className="w-32 h-3" />
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: hardModeEnabled ? 3 : 5 }).map((_, i) => (
                <span key={i} className={i < hearts ? 'text-red-500' : 'text-gray-300'}>❤️</span>
              ))}
            </div>
          </div>

          {/* Question Number */}
          <div className="text-center mb-4">
            <span className="text-muted-foreground">Question {currentQuestionIndex + 1}</span>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currentQuestion.type}</Badge>
                  <Badge 
                    className={
                      currentQuestion.difficulty === 'easy' ? 'bg-green-500' :
                      currentQuestion.difficulty === 'hard' ? 'bg-red-500' :
                      'bg-amber-500'
                    }
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={getAIHint}
                    disabled={loadingHint || isAnswerRevealed}
                    className="text-primary"
                  >
                    {loadingHint ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="h-5 w-5" />
                    )}
                    <span className="ml-1 text-xs">AI Hint</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => speakText(currentQuestion.question, selectedLanguage.id)}>
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* AI Hint Display */}
              {aiHint && (
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{aiHint}</p>
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold mb-8 text-center">{currentQuestion.question}</h2>

              {currentQuestion.pronunciation && (
                <p className="text-center text-muted-foreground mb-4 italic">
                  Pronunciation: {currentQuestion.pronunciation}
                </p>
              )}

              <div className="grid gap-3">
                {currentQuestion.options?.map((option, idx) => (
                  <Button
                    key={`${option}-${idx}`}
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
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
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

        {/* Hard Mode Challenge */}
        <Card className="mb-6 border-2 border-red-500/50 cursor-pointer hover:scale-[1.02] transition-all" onClick={startHardMode}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">🔥 Unlimited Hard Mode</h3>
              <p className="text-sm text-muted-foreground">Endless challenging questions • +25 XP each</p>
            </div>
            <Badge className="bg-red-500">♾️ UNLIMITED</Badge>
          </CardContent>
        </Card>

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
                  Review words and phrases you&apos;ve learned
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

// Dance Learner Component
interface DanceRoutine {
  id: string;
  name: string;
  artist: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  thumbnail: string;
  videoUrl: string;
  steps: DanceStep[];
}

interface DanceStep {
  id: string;
  name: string;
  description: string;
  timestamp: string;
  duration: string;
  tips: string[];
}

const danceRoutines: DanceRoutine[] = [
  {
    id: 'd1',
    name: 'Senorita',
    artist: 'Shawn Mendes & Camila Cabello',
    difficulty: 'beginner',
    duration: '3:10',
    thumbnail: 'https://img.youtube.com/vi/Pkh8UtuejGw/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/Pkh8UtuejGw',
    steps: [
      { id: 's1', name: 'Opening Sway', description: 'Gentle side-to-side hip movement with arms relaxed', timestamp: '0:00', duration: '8 counts', tips: ['Keep knees slightly bent', 'Move from your core'] },
      { id: 's2', name: 'Shoulder Roll', description: 'Roll shoulders back while stepping side', timestamp: '0:15', duration: '4 counts', tips: ['Keep movements smooth', 'Look confident'] },
      { id: 's3', name: 'Hip Circles', description: 'Circular hip motion with partner positioning', timestamp: '0:30', duration: '8 counts', tips: ['Engage your core', 'Keep upper body still'] },
    ]
  },
  {
    id: 'd2',
    name: 'Butter',
    artist: 'BTS',
    difficulty: 'intermediate',
    duration: '2:44',
    thumbnail: 'https://img.youtube.com/vi/WMweEpGlu_U/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/WMweEpGlu_U',
    steps: [
      { id: 's1', name: 'Smooth Walk', description: 'Confident walking with arm swing', timestamp: '0:00', duration: '8 counts', tips: ['Walk with attitude', 'Swing arms naturally'] },
      { id: 's2', name: 'Point & Slide', description: 'Point forward and slide to the side', timestamp: '0:20', duration: '4 counts', tips: ['Sharp pointing motion', 'Smooth slide'] },
      { id: 's3', name: 'Groove Step', description: 'Bouncy groove with shoulder movements', timestamp: '0:35', duration: '8 counts', tips: ['Stay loose', 'Feel the rhythm'] },
    ]
  },
  {
    id: 'd3',
    name: 'Levitating',
    artist: 'Dua Lipa',
    difficulty: 'beginner',
    duration: '3:23',
    thumbnail: 'https://img.youtube.com/vi/TUVcZfQe-Kw/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/TUVcZfQe-Kw',
    steps: [
      { id: 's1', name: 'Disco Point', description: 'Point up and down alternating arms', timestamp: '0:00', duration: '8 counts', tips: ['Keep arms straight', 'Add a bounce'] },
      { id: 's2', name: 'Side Step Groove', description: 'Step side to side with hip movement', timestamp: '0:20', duration: '4 counts', tips: ['Move with the beat', 'Let hips follow'] },
    ]
  },
  {
    id: 'd4',
    name: 'Savage Love',
    artist: 'Jason Derulo',
    difficulty: 'intermediate',
    duration: '2:51',
    thumbnail: 'https://img.youtube.com/vi/gBGHXbxQlF4/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/gBGHXbxQlF4',
    steps: [
      { id: 's1', name: 'TikTok Arms', description: 'Arm wave motion popularized on TikTok', timestamp: '0:00', duration: '8 counts', tips: ['Start from shoulder', 'Flow through to fingers'] },
      { id: 's2', name: 'Body Roll', description: 'Wave motion through your body', timestamp: '0:15', duration: '4 counts', tips: ['Initiate from chest', 'Keep it smooth'] },
    ]
  },
  {
    id: 'd5',
    name: 'Blinding Lights',
    artist: 'The Weeknd',
    difficulty: 'advanced',
    duration: '3:20',
    thumbnail: 'https://img.youtube.com/vi/fHI8X4OXluQ/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/fHI8X4OXluQ',
    steps: [
      { id: 's1', name: 'Running Man', description: 'Classic running man with 80s flair', timestamp: '0:00', duration: '8 counts', tips: ['Lift knees high', 'Pump arms opposite'] },
      { id: 's2', name: 'Moon Walk Slide', description: 'Michael Jackson inspired slides', timestamp: '0:20', duration: '8 counts', tips: ['Push off back foot', 'Keep upper body still'] },
    ]
  },
];

function DanceLearner({ onBack }: { onBack: () => void }) {
  const [selectedRoutine, setSelectedRoutine] = useState<DanceRoutine | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (selectedRoutine) {
    const currentStep = selectedRoutine.steps[currentStepIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setSelectedRoutine(null)}>
              ← Back to Routines
            </Button>
            <h1 className="text-xl font-bold">{selectedRoutine.name}</h1>
            <Badge className={
              selectedRoutine.difficulty === 'beginner' ? 'bg-green-500' :
              selectedRoutine.difficulty === 'advanced' ? 'bg-red-500' : 'bg-amber-500'
            }>
              {selectedRoutine.difficulty}
            </Badge>
          </div>

          {/* Video Player */}
          <Card className="mb-6 overflow-hidden">
            <div className="aspect-video bg-black">
              <iframe
                src={`${selectedRoutine.videoUrl}?autoplay=${isPlaying ? 1 : 0}`}
                title={selectedRoutine.name}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </Card>

          {/* Step Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Step {currentStepIndex + 1} of {selectedRoutine.steps.length}</span>
              <span className="text-sm text-muted-foreground">{currentStep?.timestamp}</span>
            </div>
            <Progress value={((currentStepIndex + 1) / selectedRoutine.steps.length) * 100} className="h-3" />
          </div>

          {/* Current Step */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm">
                  {currentStepIndex + 1}
                </span>
                {currentStep?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{currentStep?.description}</p>
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <span>⏱️ Duration: {currentStep?.duration}</span>
                <span>📍 Timestamp: {currentStep?.timestamp}</span>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">💡 Tips:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {currentStep?.tips.map((tip, i) => (
                    <li key={i} className="text-muted-foreground">{tip}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(prev => prev - 1)}
            >
              ← Previous Step
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <Play className="h-4 w-4 mr-2" />
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button 
              className="flex-1"
              disabled={currentStepIndex === selectedRoutine.steps.length - 1}
              onClick={() => setCurrentStepIndex(prev => prev + 1)}
            >
              Next Step →
            </Button>
          </div>

          {/* All Steps */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {selectedRoutine.steps.map((step, i) => (
                  <Button
                    key={step.id}
                    variant={i === currentStepIndex ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setCurrentStepIndex(i)}
                  >
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs mr-3">
                      {i + 1}
                    </span>
                    {step.name}
                    <span className="ml-auto text-xs text-muted-foreground">{step.timestamp}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">💃 Dance Choreographer</h1>
          <div />
        </div>

        <div className="text-center mb-8">
          <p className="text-lg text-muted-foreground">Learn full dance routines step-by-step</p>
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-6 justify-center">
          <Badge className="bg-green-500 cursor-pointer">Beginner</Badge>
          <Badge className="bg-amber-500 cursor-pointer">Intermediate</Badge>
          <Badge className="bg-red-500 cursor-pointer">Advanced</Badge>
        </div>

        {/* Dance Routines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {danceRoutines.map((routine) => (
            <Card 
              key={routine.id}
              className="cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden group"
              onClick={() => setSelectedRoutine(routine)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={routine.thumbnail}
                  alt={routine.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${routine.id}/640/360`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <Badge className={`absolute top-3 right-3 ${
                  routine.difficulty === 'beginner' ? 'bg-green-500' :
                  routine.difficulty === 'advanced' ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                  {routine.difficulty}
                </Badge>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{routine.name}</h3>
                  <p className="text-white/70 text-sm">{routine.artist}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-8 w-8 text-black ml-1" />
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>⏱️ {routine.duration}</span>
                  <span>📝 {routine.steps.length} steps</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
