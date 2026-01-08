import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, Image as ImageIcon, LogIn, Upload, Wand2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useUserRestrictions } from '@/hooks/useUserRestrictions';

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('default');
  const [imageModel, setImageModel] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [autoDownload, setAutoDownload] = useState(true);
  
  // Image editing states
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { restrictions } = useUserRestrictions();

  // Check if user is restricted from image generation
  if (restrictions.image_generation_disabled) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have been restricted from using image generation. Contact an admin for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive'
      });
      return;
    }

    if (!isLoggedIn) {
      toast({
        title: 'Login Required',
        description: 'Please log in to generate images',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('image-ai', {
        body: { action: 'generate', prompt, style, imageModel }
      });

      if (error) throw error;

      setGeneratedImage(data.imageUrl);
      
      // Auto-download the image
      if (autoDownload) {
        downloadImage(data.imageUrl, `askify-generated-${Date.now()}.png`);
        toast({
          title: 'Success',
          description: 'Image generated and downloaded!'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Image generated successfully!'
        });
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      const errorMessage = error?.message || 'Failed to generate image';
      toast({
        title: 'Error',
        description: errorMessage.includes('Unauthorized') ? 'Please log in to generate images' : errorMessage,
        variant: 'destructive'
      });
      if (errorMessage.includes('Unauthorized')) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    downloadImage(generatedImage, 'askify-generated-image.png');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setEditedImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEditImage = async () => {
    if (!uploadedImage || !editPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please upload an image and enter edit instructions',
        variant: 'destructive'
      });
      return;
    }

    if (!isLoggedIn) {
      toast({
        title: 'Login Required',
        description: 'Please log in to edit images',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    setEditLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('image-ai', {
        body: { 
          action: 'edit', 
          prompt: editPrompt, 
          imageUrl: uploadedImage,
          imageModel: 'gemini' // Use Gemini for editing
        }
      });

      if (error) throw error;

      setEditedImage(data.imageUrl);
      
      // Auto-download edited image
      if (autoDownload) {
        downloadImage(data.imageUrl, `askify-edited-${Date.now()}.png`);
        toast({
          title: 'Success',
          description: 'Image edited and downloaded!'
        });
      } else {
        toast({
          title: 'Success',
          description: 'Image edited successfully!'
        });
      }
    } catch (error: any) {
      console.error('Error editing image:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to edit image',
        variant: 'destructive'
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDownloadEdited = () => {
    if (!editedImage) return;
    downloadImage(editedImage, 'askify-edited-image.png');
  };

  if (isLoggedIn === false) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            AI Image Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">Please log in to use the image generator</p>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="h-4 w-4" />
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          AI Image Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="generate">Generate Image</TabsTrigger>
            <TabsTrigger value="edit">Edit Image</TabsTrigger>
          </TabsList>

          {/* Generate Tab */}
          <TabsContent value="generate" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Image Prompt</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene landscape with mountains..."
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={imageModel} onValueChange={setImageModel} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="gemini">Gemini (Default)</SelectItem>
                    <SelectItem value="flux">Flux</SelectItem>
                    <SelectItem value="flux-realism">Flux Realism</SelectItem>
                    <SelectItem value="flux-cablyai">Flux CablyAI</SelectItem>
                    <SelectItem value="flux-anime">Flux Anime</SelectItem>
                    <SelectItem value="flux-3d">Flux 3D</SelectItem>
                    <SelectItem value="turbo">Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle} disabled={loading}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="ghibli">Studio Ghibli</SelectItem>
                    <SelectItem value="realistic">Realistic</SelectItem>
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || !prompt.trim()} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>

            {generatedImage && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full h-auto"
                  />
                </div>
                <Button onClick={handleDownload} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Edit Tab */}
          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Image to Edit</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {uploadedImage ? (
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span>Click to upload an image</span>
                    <span className="text-xs">PNG, JPG up to 10MB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPrompt">Edit Instructions</Label>
              <Input
                id="editPrompt"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="Make it look like a painting, add sunset colors..."
                disabled={editLoading}
              />
            </div>

            <Button 
              onClick={handleEditImage} 
              disabled={editLoading || !uploadedImage || !editPrompt.trim()} 
              className="w-full"
            >
              {editLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Edit Image with AI
                </>
              )}
            </Button>

            {editedImage && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img 
                    src={editedImage} 
                    alt="Edited" 
                    className="w-full h-auto"
                  />
                </div>
                <Button onClick={handleDownloadEdited} variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Edited Image
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
