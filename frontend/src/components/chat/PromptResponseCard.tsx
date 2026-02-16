import { Avatar, Chip } from '@heroui/react';
import { Message } from '../../types/messages';

interface PromptResponseCardProps {
  message: Message;
  isOwn: boolean;
  onComment: () => void;
  onReplyInChat: () => void;
  onTap: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function PromptResponseCard({
  message,
  isOwn,
  onComment,
  onReplyInChat,
  onTap,
}: PromptResponseCardProps) {
  const { promptData, sender, replyCount } = message;

  if (!promptData) return null;

  return (
    <div className="flex justify-center py-1.5">
      <button
        type="button"
        className="w-[85%] text-left bg-gradient-to-br from-primary/15 to-secondary/10 rounded-2xl p-3.5 space-y-2 hover:from-primary/20 hover:to-secondary/15 transition-all"
        onClick={onTap}
      >
        {/* Prompt text + category */}
        <div className="flex items-start gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
            />
          </svg>
          <p className="text-xs text-default-400 italic flex-1">
            {promptData.promptText}
          </p>
          {promptData.promptCategory && (
            <Chip size="sm" variant="flat" color="primary" className="text-[10px] flex-shrink-0">
              {promptData.promptCategory}
            </Chip>
          )}
        </div>

        {/* Responder info + response */}
        <div className="flex gap-2.5">
          <Avatar
            name={sender?.displayName?.charAt(0).toUpperCase() || '?'}
            src={sender?.avatarUrl || undefined}
            size="sm"
            className="flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium truncate">
                {isOwn ? 'You' : sender?.displayName || 'Unknown'}
              </span>
              <span className="text-[10px] text-default-400 flex-shrink-0">
                {formatTime(message.createdAt)}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap break-words mt-0.5">
              {promptData.responseContent}
            </p>
          </div>
        </div>

        {/* Reply buttons + count */}
        <div className="flex items-center justify-between pt-0.5">
          {replyCount && replyCount > 0 ? (
            <span className="text-[10px] text-primary">
              {replyCount} {replyCount === 1 ? 'comment' : 'comments'}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-default-400 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onComment();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                />
              </svg>
              Comment
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-default-400 hover:text-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onReplyInChat();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
              Reply in chat
            </button>
          </div>
        </div>
      </button>
    </div>
  );
}
