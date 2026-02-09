import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseAvatarUploadResult {
  uploadAvatar: (file: File) => Promise<string>;
  isUploading: boolean;
  error: Error | null;
}

/**
 * Hook to upload avatar images to Supabase Storage.
 * Uploads to avatars/{userId}/avatar.{ext} and returns the public URL.
 */
export function useAvatarUpload(): UseAvatarUploadResult {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('Must be authenticated to upload avatar');
    }

    setIsUploading(true);
    setError(null);

    try {
      // Get file extension from the file name
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload with upsert to replace existing avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-busting timestamp to ensure fresh image loads
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      return publicUrl;
    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed');
      setError(uploadError);
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading, error };
}
