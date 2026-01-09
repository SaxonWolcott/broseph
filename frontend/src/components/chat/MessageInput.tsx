import { useState, useRef, useEffect } from 'react';
import { Textarea, Button } from '@heroui/react';

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  maxLength?: number;
}

export function MessageInput({
  onSend,
  isLoading,
  maxLength = 2000,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > maxLength) return;

    onSend(trimmed);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = content.length > maxLength;
  const charCount = content.length;
  const showCharCount = content.length > maxLength * 0.8;

  return (
    <div className="border-t border-divider p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
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
        <Button
          isIconOnly
          color="primary"
          onPress={handleSubmit}
          isDisabled={!content.trim() || isOverLimit || isLoading}
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
  );
}
