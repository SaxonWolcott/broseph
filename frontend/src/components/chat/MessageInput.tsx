import { useState, useRef, useEffect } from 'react';
import { Textarea, Button, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 10;

export interface ReplyContext {
  responseId?: string;      // For prompt response comments/replies
  senderName: string;
  replyInChat?: boolean;    // For prompt response reply-in-chat
  messageId?: string;       // For general message replies
  previewContent?: string;  // Preview of the message being replied to
}

interface MessageInputProps {
  onSend: (content: string, imageFiles?: File[]) => void;
  isLoading?: boolean;
  maxLength?: number;
  replyContext?: ReplyContext | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  onSend,
  isLoading,
  maxLength = 2000,
  replyContext,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Focus input when reply context is set
  useEffect(() => {
    if (replyContext && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyContext]);

  // Close emoji picker on outside click
  useEffect(() => {
    if (!isEmojiPickerOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  // Cleanup all blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - selectedImages.length;
    if (remaining <= 0) return;

    const validFiles: File[] = [];
    for (const file of files.slice(0, remaining)) {
      if (file.size > MAX_IMAGE_SIZE) {
        continue; // Skip oversized files
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const newUrls = validFiles.map((f) => URL.createObjectURL(f));
    setSelectedImages((prev) => [...prev, ...validFiles]);
    setImagePreviewUrls((prev) => [...prev, ...newUrls]);

    // Reset file input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed && selectedImages.length === 0) return;
    if (trimmed.length > maxLength) return;

    onSend(trimmed, selectedImages.length > 0 ? selectedImages : undefined);
    setContent('');
    // Clear images without revoking — useSendMessage will use them
    setSelectedImages([]);
    setImagePreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? content.length;
      const end = textarea.selectionEnd ?? content.length;
      const newContent = content.slice(0, start) + emoji.native + content.slice(end);
      setContent(newContent);
      // Restore cursor position after the inserted emoji
      requestAnimationFrame(() => {
        const pos = start + emoji.native.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emoji.native);
    }
  };

  const isOverLimit = content.length > maxLength;
  const charCount = content.length;
  const showCharCount = content.length > maxLength * 0.8;
  const canSend = (content.trim().length > 0 || selectedImages.length > 0) && !isOverLimit && !isLoading;

  return (
    <div className="border-t border-divider">
      {/* Reply context bar */}
      {replyContext && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-default-100 border-b border-divider">
          <div className="flex items-center gap-1.5 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5 text-primary flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
            <span className="text-xs text-default-400 truncate">
              {replyContext.messageId
                ? <>Replying to <span className="text-primary font-medium">{replyContext.senderName}</span></>
                : replyContext.replyInChat
                  ? <>Replying in chat to <span className="text-primary font-medium">{replyContext.senderName}</span>'s response</>
                  : <>Commenting on <span className="text-primary font-medium">{replyContext.senderName}</span>'s response</>
              }
            </span>
          </div>
          <button
            type="button"
            className="text-default-400 hover:text-default-300 p-0.5"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Image preview row */}
      {imagePreviewUrls.length > 0 && (
        <div className="px-3 pt-2 pb-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {imagePreviewUrls.map((url, index) => (
              <div key={url} className="relative flex-shrink-0">
                <img
                  src={url}
                  alt={`Selected image ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-divider"
                />
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-default-200 hover:bg-default-300 rounded-full flex items-center justify-center"
                  onClick={() => removeImage(index)}
                  aria-label={`Remove image ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-3 h-3"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-default-400">
            {selectedImages.length}/{MAX_IMAGES} images
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="flex items-end gap-2">
          {/* + button with popover */}
          <Popover
            placement="top"
            isOpen={isPopoverOpen}
            onOpenChange={setIsPopoverOpen}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="flex-shrink-0 mb-0.5"
                aria-label="Attach"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="py-1">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-default-100 rounded-lg transition-colors"
                  onClick={() => {
                    setIsPopoverOpen(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                  Images
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Hidden file input — multiple */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={replyContext ? 'Write a reply...' : 'Type a message...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              minRows={1}
              maxRows={4}
              classNames={{
                inputWrapper: 'bg-default-100',
              }}
            />
            {showCharCount && (
              <span
                className={`absolute bottom-1 right-2 text-xs ${
                  isOverLimit ? 'text-danger' : 'text-default-400'
                }`}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
          {/* Emoji picker button */}
          <div className="relative flex-shrink-0 mb-0.5" ref={emojiPickerRef}>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setIsEmojiPickerOpen((prev) => !prev)}
              aria-label="Emoji picker"
              className={isEmojiPickerOpen ? 'text-primary' : ''}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </Button>
            {isEmojiPickerOpen && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                  maxFrequentRows={1}
                />
              </div>
            )}
          </div>

          <Button
            isIconOnly
            color="primary"
            onPress={handleSubmit}
            isDisabled={!canSend}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
