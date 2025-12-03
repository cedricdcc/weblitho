import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedImage {
  id: string;
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const uploadImage = useCallback(async (file: File): Promise<UploadedImage | null> => {
    try {
      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-assets')
        .getPublicUrl(filePath);

      const uploadedImage: UploadedImage = {
        id: filePath,
        name: file.name,
        url: publicUrl,
        size: file.size,
        createdAt: new Date().toISOString(),
      };

      setImages(prev => [...prev, uploadedImage]);
      
      toast({
        title: 'Image uploaded',
        description: 'Your image is ready to use',
      });

      return uploadedImage;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const deleteImage = useCallback(async (imageId: string) => {
    try {
      const { error } = await supabase.storage
        .from('project-assets')
        .remove([imageId]);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      
      toast({
        title: 'Image deleted',
        description: 'Image has been removed',
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const fetchUserImages = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from('project-assets')
        .list(user.id);

      if (error) throw error;

      const uploadedImages: UploadedImage[] = (data || []).map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('project-assets')
          .getPublicUrl(`${user.id}/${file.name}`);

        return {
          id: `${user.id}/${file.name}`,
          name: file.name,
          url: publicUrl,
          size: file.metadata?.size || 0,
          createdAt: file.created_at || new Date().toISOString(),
        };
      });

      setImages(uploadedImages);
    } catch (error) {
      console.error('Fetch images error:', error);
    }
  }, []);

  return {
    images,
    uploading,
    uploadImage,
    deleteImage,
    fetchUserImages,
  };
};
