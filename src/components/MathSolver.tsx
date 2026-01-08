import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Calculator, BookOpen, GraduationCap, Camera, SwitchCamera, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRestrictions } from '@/hooks/useUserRestrictions';

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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const { restrictions } = useUserRestrictions();

  // Check if user is restricted from math solver
  if (restrictions.math_solver_disabled) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have been restricted from using the Math Solver. Contact an admin for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  // Get available camera devices
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        setCameraDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedCamera) {
          // Prefer back camera
          const backCam = videoDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
          setSelectedCamera(backCam?.deviceId || videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error getting cameras:', err);
      }
    };
    getCameras();
  }, []);

  // Start/stop camera stream when showCamera or selectedCamera changes
  useEffect(() => {
    if (showCamera && selectedCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCamera, selectedCamera]);

  const startCamera = async () => {
    try {
      stopCamera();
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedCamera ? { exact: selectedCamera } : undefined, facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast({ title: 'Camera Error', description: 'Could not access camera. Please check permissions.', variant: 'destructive' });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setSolution(null);
      setShowCamera(false);
      stopCamera();
      toast({ title: 'Photo captured!', description: 'Now tap Solve to get the answer.' });
    }
  };

  const switchCamera = () => {
    if (cameraDevices.length < 2) return;
    const idx = cameraDevices.findIndex(d => d.deviceId === selectedCamera);
    const nextIdx = (idx + 1) % cameraDevices.length;
    setSelectedCamera(cameraDevices[nextIdx].deviceId);
  };

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

      {/* Camera Section */}
      {showCamera && (
        <div className="relative rounded-xl overflow-hidden border border-border bg-black">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-64 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
            {cameraDevices.length > 1 && (
              <Button size="icon" variant="secondary" onClick={switchCamera} className="rounded-full h-12 w-12">
                <SwitchCamera className="h-5 w-5" />
              </Button>
            )}
            <Button size="lg" onClick={captureFromCamera} className="rounded-full h-14 w-14 bg-white hover:bg-white/90">
              <Camera className="h-6 w-6 text-black" />
            </Button>
            <Button size="icon" variant="destructive" onClick={() => { setShowCamera(false); stopCamera(); }} className="rounded-full h-12 w-12">
              ✕
            </Button>
          </div>
          {cameraDevices.length > 1 && (
            <div className="absolute top-2 right-2">
              <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-black/60 text-white border-white/30">
                  <SelectValue placeholder="Camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameraDevices.map((d, i) => (
                    <SelectItem key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Upload/Camera Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline" 
          className="h-14 text-sm gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all touch-target"
          disabled={loading || showCamera}
        >
          <Upload className="h-5 w-5" />
          Upload
        </Button>
        <Button 
          onClick={() => setShowCamera(true)} 
          variant="outline" 
          className="h-14 text-sm gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all touch-target"
          disabled={loading || showCamera}
        >
          <Camera className="h-5 w-5" />
          Camera
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