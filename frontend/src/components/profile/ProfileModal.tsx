import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Avatar,
  Divider,
} from '@heroui/react';
import { Profile } from '../../types/auth';
import { useAvatarUpload } from '../../hooks/useAvatarUpload';
import { useOnboard } from '../../hooks/useMe';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

const MAX_NAME_LENGTH = 100;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ProfileModal({ isOpen, onClose, profile }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const onboard = useOnboard();
  const { signOut } = useAuth();

  // Reset form when modal opens with fresh profile data
  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName || '');
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);
      setShouldRemoveAvatar(false);
    }
  }, [isOpen, profile.displayName]);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setFileError(null);

    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Please select a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Image must be smaller than 2MB');
      return;
    }

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShouldRemoveAvatar(false); // Cancel removal if selecting new file
  };

  const handleRemoveAvatar = () => {
    // Clear any selected file
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShouldRemoveAvatar(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      let avatarUrl: string | undefined;

      // Handle avatar changes
      if (shouldRemoveAvatar) {
        // Send empty string to clear avatar in database
        avatarUrl = '';
      } else if (selectedFile) {
        // Upload new avatar
        avatarUrl = await uploadAvatar(selectedFile);
      }

      // Update profile with new data
      await onboard.mutateAsync({
        displayName: displayName.trim() || undefined,
        avatarUrl,
      });

      onClose();
    } catch (error) {
      // Errors are handled by the mutations
    }
  };

  const handleClose = () => {
    setDisplayName(profile.displayName || '');
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFileError(null);
    setShouldRemoveAvatar(false);
    onboard.reset();
    onClose();
  };

  const displayNameForAvatar = displayName || profile.email || 'User';
  const initial = displayNameForAvatar.charAt(0).toUpperCase();
  // Show no image when removing, preview when selecting new, or current avatar
  const currentAvatarUrl = shouldRemoveAvatar ? undefined : (previewUrl || profile.avatarUrl || undefined);
  const hasExistingAvatar = !!profile.avatarUrl && !shouldRemoveAvatar;

  const isValid = displayName.length <= MAX_NAME_LENGTH;
  const isSaving = isUploading || onboard.isPending;
  const hasChanges =
    displayName !== (profile.displayName || '') ||
    selectedFile !== null ||
    shouldRemoveAvatar;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalBody className="items-center gap-4">
          {/* Avatar with click to change */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary group"
              aria-label="Change profile picture"
            >
              <Avatar
                src={currentAvatarUrl}
                name={initial}
                className="w-24 h-24 text-2xl cursor-pointer"
                showFallback
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="white"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
              </div>
            </button>
            <p className="text-xs text-default-400">Click to change photo</p>
            {(hasExistingAvatar || selectedFile) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-danger hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />

          {fileError && (
            <p className="text-sm text-danger text-center">{fileError}</p>
          )}

          {/* Display name input */}
          <Input
            label="Display Name"
            placeholder="Enter your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            description={`${displayName.length}/${MAX_NAME_LENGTH} characters`}
            isInvalid={displayName.length > MAX_NAME_LENGTH}
            errorMessage={displayName.length > MAX_NAME_LENGTH ? 'Name too long' : undefined}
            className="w-full"
          />

          {onboard.isError && (
            <p className="text-sm text-danger">
              {onboard.error?.message || 'Failed to update profile'}
            </p>
          )}

          {/* Sign Out Section */}
          <Divider className="my-2" />
          <Button
            variant="light"
            color="danger"
            onPress={signOut}
            className="w-full"
            startContent={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            }
          >
            Sign Out
          </Button>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={isSaving}
            isDisabled={!isValid || !hasChanges}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
