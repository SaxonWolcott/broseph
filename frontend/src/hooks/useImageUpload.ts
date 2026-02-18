import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseImageUploadResult {
  uploadImage: (file: File, groupId: string) => Promise<string>;
  uploadImages: (files: File[], groupId: string) => Promise<string[]>;
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;
}

/**
 * Hook to upload message images to Supabase Storage.
 * Uploads to message-images/{groupId}/{userId}/{uuid}.{ext} and returns the public URL.
 */
export function useImageUpload(): UseImageUploadResult {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadSingle = async (file: File, groupId: string): Promise<string> => {
    if (!user) {
      throw new Error('Must be authenticated to upload images');
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${groupId}/${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('message-images')
      .upload(filePath, file, {
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('message-images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const uploadImage = async (file: File, groupId: string): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const url = await uploadSingle(file, groupId);
      setUploadProgress(100);
      return url;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed');
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadImages = async (files: File[], groupId: string): Promise<string[]> => {
    if (!user) {
      throw new Error('Must be authenticated to upload images');
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let completed = 0;
      const urls = await Promise.all(
        files.map(async (file) => {
          const url = await uploadSingle(file, groupId);
          completed++;
          setUploadProgress(Math.round((completed / files.length) * 100));
          return url;
        }),
      );
      return urls;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed');
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, uploadImages, isUploading, uploadProgress, error };
}
