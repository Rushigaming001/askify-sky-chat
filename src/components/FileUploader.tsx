import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileIcon, X, Upload, Download, Loader2, File, Image, Video, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onUpload: (fileUrl: string, fileName: string, fileType: string, fileSize: number) => void;
  maxSize?: number; // in MB
  accept?: string;
  userId?: string;
  chatType: 'public' | 'friends' | 'dm' | 'group';
  chatId?: string;
}

export function FileUploader({ 
  onUpload, 
  maxSize = 200, 
  accept = "*/*",
  userId,
  chatType,
  chatId
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${maxSize}MB`,
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !userId) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${chatType}/${Date.now()}-${selectedFile.name}`;

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, selectedFile, { 
          cacheControl: '3600',
          upsert: false 
        });

      clearInterval(progressInterval);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Record file in database
      await supabase.from('chat_files').insert({
        user_id: userId,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        file_url: publicUrl,
        chat_type: chatType,
        chat_id: chatId || null
      });

      setProgress(100);
      onUpload(publicUrl, selectedFile.name, selectedFile.type, selectedFile.size);
      
      toast({
        title: 'File uploaded!',
        description: selectedFile.name
      });
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileSelect}
      />

      {!selectedFile ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File (Max {maxSize}MB)
        </Button>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            {getFileIcon(selectedFile.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            {uploading && (
              <Progress value={progress} className="h-1 mt-2" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {!uploading ? (
              <>
                <Button size="sm" onClick={handleUpload}>
                  <Upload className="h-4 w-4 mr-1" />
                  Upload
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelUpload}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// File display component for messages
interface FileDisplayProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
}

export function FileDisplay({ fileUrl, fileName, fileType, fileSize }: FileDisplayProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');

  if (isImage) {
    return (
      <div className="relative group">
        <img 
          src={fileUrl} 
          alt={fileName} 
          className="max-w-[250px] max-h-[250px] rounded-lg cursor-pointer"
          onClick={() => window.open(fileUrl, '_blank')}
        />
        <a 
          href={fileUrl}
          download={fileName}
          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download className="h-4 w-4 text-white" />
        </a>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="relative max-w-[300px]">
        <video 
          src={fileUrl} 
          controls 
          className="w-full rounded-lg"
        />
      </div>
    );
  }

  return (
    <a 
      href={fileUrl}
      download={fileName}
      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors max-w-[300px]"
    >
      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
        {getFileIcon(fileType)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        )}
      </div>
      <Download className="h-4 w-4 flex-shrink-0" />
    </a>
  );
}