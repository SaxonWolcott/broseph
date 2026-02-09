import { Avatar, Spinner } from '@heroui/react';
import { Message } from '../../types/messages';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end`}
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

        <div
          className={`px-3 py-2 rounded-2xl ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-default-100 text-foreground rounded-bl-sm'
          } ${message.pending ? 'opacity-70' : ''}`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        <div className="flex items-center gap-1 mt-0.5 mx-1">
          <span className="text-[10px] text-default-400">
            {formatTime(message.createdAt)}
          </span>
          {message.pending && (
            <Spinner size="sm" className="w-3 h-3" />
          )}
          {message.error && (
            <span className="text-[10px] text-danger">Failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
