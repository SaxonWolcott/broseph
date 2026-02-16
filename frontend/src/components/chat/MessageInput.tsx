import { useState, useRef, useEffect } from 'react';
import { Textarea, Button } from '@heroui/react';

export interface ReplyContext {
  responseId?: string;      // For prompt response comments/replies
  senderName: string;
  replyInChat?: boolean;    // For prompt response reply-in-chat
  messageId?: string;       // For general message replies
  previewContent?: string;  // Preview of the message being replied to
}

interface MessageInputProps {
  onSend: (content: string) => void;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      <div className="p-3">
        <div className="flex items-end gap-2">
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
    </div>
  );
}
