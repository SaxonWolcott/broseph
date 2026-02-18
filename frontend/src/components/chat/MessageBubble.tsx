import { Avatar, Spinner } from '@heroui/react';
import { Message } from '../../types/messages';
import { ImageCardStack } from './ImageCardStack';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
  isSelected?: boolean;
  onSelect?: (messageId: string) => void;
  onImageExpand?: (urls: string[], startIndex: number) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  onReply,
  isSelected,
  onSelect,
  onImageExpand,
}: MessageBubbleProps) {
  const hasImages = !!message.imageUrls?.length;
  const hasText = !!message.content && message.content.length > 0;

  const handleBubbleClick = () => {
    if (!message.pending && onSelect) {
      onSelect(isSelected ? '' : message.id);
    }
  };

  return (
    <div
      className={`group flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      {showAvatar && !isOwn ? (
        <Avatar
          name={message.sender?.displayName?.charAt(0).toUpperCase() || '?'}
          src={message.sender?.avatarUrl || undefined}
          size="sm"
          className="flex-shrink-0"
        />
      ) : (
        <div className="w-8" /> // Spacer for alignment
      )}

      <div
        className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}
      >
        {!isOwn && showAvatar && (
          <span className="text-xs text-default-400 mb-1 ml-1">
            {message.sender?.displayName || message.sender?.handle || 'Unknown'}
          </span>
        )}

        <div className="flex items-center gap-1">
          {/* Reply button — shown on the left for own messages */}
          {isOwn && onReply && !message.pending && (
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-default-400 hover:text-default-300"
              onClick={() => onReply(message)}
              aria-label="Reply to message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
          )}

          {hasImages ? (
            /* Images render without a bubble background */
            <div
              className={`cursor-pointer ${message.pending ? 'opacity-70' : ''}`}
              onClick={handleBubbleClick}
            >
              <ImageCardStack
                imageUrls={message.imageUrls!}
                isOwn={isOwn}
                onImageExpand={onImageExpand ?? (() => {})}
              />
            </div>
          ) : hasText ? (
            /* Text-only message gets the bubble */
            <div
              className={`rounded-2xl cursor-pointer px-3 py-2 ${
                isOwn
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-default-100 text-foreground rounded-bl-sm'
              } ${message.pending ? 'opacity-70' : ''}`}
              onClick={handleBubbleClick}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          ) : null}

          {/* Reply button — shown on the right for others' messages */}
          {!isOwn && onReply && !message.pending && (
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-default-400 hover:text-default-300"
              onClick={() => onReply(message)}
              aria-label="Reply to message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
            </button>
          )}
        </div>

        {/* Text bubble below images — separate from the image */}
        {hasImages && hasText && (
          <div
            className={`rounded-2xl cursor-pointer px-3 py-2 mt-1 ${
              isOwn
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-default-100 text-foreground rounded-bl-sm'
            } ${message.pending ? 'opacity-70' : ''}`}
            onClick={handleBubbleClick}
          >
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )}

        {/* Timestamp — only visible when selected or pending/error */}
        {(isSelected || message.pending || message.error) && (
          <div className="flex items-center gap-1 mt-0.5 mx-1">
            {isSelected && (
              <span className="text-[10px] text-default-400">
                {formatTime(message.createdAt)}
              </span>
            )}
            {message.pending && (
              <Spinner size="sm" className="w-3 h-3" />
            )}
            {message.error && (
              <span className="text-[10px] text-danger">Failed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
