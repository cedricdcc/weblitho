import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, Copy, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploadPanelProps {
  onInsertImage?: (url: string) => void;
}

export const ImageUploadPanel = ({ onInsertImage }: ImageUploadPanelProps) => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, uploading, uploadImage, deleteImage, fetchUserImages } = useImageUpload();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserImages();
    }
  }, [open, fetchUserImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadImage(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL copied',
      description: 'Image URL copied to clipboard',
    });
  };

  const handleInsert = (image: UploadedImage) => {
    if (onInsertImage) {
      onInsertImage(image.url);
      setOpen(false);
      toast({
        title: 'Image inserted',
        description: 'The image URL has been added to your prompt',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-white/5 border-border/50 hover:bg-white/10 hover:border-primary/50"
        >
          <ImageIcon className="h-4 w-4" />
          Images
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Image Library
          </DialogTitle>
        </DialogHeader>
        
        {/* Upload Area */}
        <div className="px-6 py-4 border-b border-border/50">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full py-8 px-4 rounded-xl border-2 border-dashed transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              uploading ? "border-primary/50 bg-primary/5" : "border-border/50"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground/70">
                  PNG, JPG, GIF up to 5MB
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Image Grid */}
        <ScrollArea className="flex-1 max-h-[50vh]">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No images uploaded yet</p>
              <p className="text-sm text-muted-foreground/70">
                Upload images to use in your generated websites
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-lg overflow-hidden border border-border/50 bg-muted/30"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleInsert(image)}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleCopyUrl(image.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => deleteImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-xs truncate text-foreground">{image.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
