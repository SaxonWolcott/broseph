import { useState } from 'react';
import { Button, Textarea, Chip, Avatar, Spinner } from '@heroui/react';
import { Prompt, PromptRespondent } from '../../types/prompts';
import { usePromptResponseReplies } from '../../hooks/usePromptResponseReplies';

/**
 * Inline comments list for a single respondent, loaded on demand.
 */
function ResponseComments({ responseId }: { responseId: string }) {
  const { data, isLoading } = usePromptResponseReplies(responseId);
  const comments = data?.replies ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-2">
        <Spinner size="sm" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-[10px] text-default-400 pl-9 py-1">No comments yet.</p>
    );
  }

  return (
    <div className="pl-9 space-y-1.5 mt-1.5">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-1.5 items-start">
          <Avatar
            name={c.sender.displayName?.charAt(0).toUpperCase() || '?'}
            src={c.sender.avatarUrl || undefined}
            size="sm"
            className="flex-shrink-0 w-5 h-5 text-[8px]"
          />
          <div className="min-w-0">
            <span className="text-[10px] font-medium">{c.sender.displayName || 'Unknown'}</span>
            <p className="text-[10px] text-default-500">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface PromptBannerProps {
  prompt: Prompt;
  hasResponded: boolean;
  respondents: PromptRespondent[];
  totalMembers: number;
  onSubmitResponse: (content: string) => void;
  isSubmitting: boolean;
  onReplyToResponse?: (responseId: string, senderName: string, replyInChat: boolean) => void;
}

export function PromptBanner({
  prompt,
  hasResponded,
  respondents,
  totalMembers,
  onSubmitResponse,
  isSubmitting,
  onReplyToResponse,
}: PromptBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const handleSubmit = () => {
    const trimmed = responseText.trim();
    if (!trimmed) return;
    onSubmitResponse(trimmed);
    setResponseText('');
    setIsExpanded(false);
  };

  const toggleComments = (responseId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(responseId)) {
        next.delete(responseId);
      } else {
        next.add(responseId);
      }
      return next;
    });
  };

  /** Shared respondent list used in both answered and unanswered states */
  const respondentList = respondents.length > 0 && (
    <div className="max-h-64 overflow-y-auto space-y-2">
      {respondents.map((r) => (
        <div key={r.responseId} className="bg-default-50 rounded-lg p-2.5">
          <div className="flex gap-2">
            <Avatar
              name={r.displayName?.charAt(0).toUpperCase() || '?'}
              src={r.avatarUrl || undefined}
              size="sm"
              className="flex-shrink-0 w-7 h-7"
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium">
                {r.displayName || 'Unknown'}
              </span>
              <p className="text-xs text-default-500 line-clamp-3 mt-0.5">
                {r.content}
              </p>

              {/* Comment + Reply in chat + Show comments */}
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  className="text-[10px] text-primary hover:text-primary-400 transition-colors"
                  onClick={() =>
                    onReplyToResponse?.(r.responseId, r.displayName || 'Unknown', false)
                  }
                >
                  Comment
                </button>
                <button
                  type="button"
                  className="text-[10px] text-default-400 hover:text-primary transition-colors"
                  onClick={() =>
                    onReplyToResponse?.(r.responseId, r.displayName || 'Unknown', true)
                  }
                >
                  Reply in chat
                </button>

                {r.replyCount > 0 && (
                  <button
                    type="button"
                    className="flex items-center gap-0.5 text-[10px] text-default-400 hover:text-default-300 transition-colors"
                    onClick={() => toggleComments(r.responseId)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-2.5 h-2.5 transition-transform ${
                        expandedComments.has(r.responseId) ? 'rotate-90' : ''
                      }`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                    {expandedComments.has(r.responseId) ? 'Hide' : 'Show'} comments ({r.replyCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Expanded comments */}
          {expandedComments.has(r.responseId) && (
            <ResponseComments responseId={r.responseId} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="border-b border-divider bg-default-100">
      {/* Collapsed row — always visible */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Lightbulb icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-warning flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
          />
        </svg>

        {hasResponded ? (
          <span className="flex-1 text-sm text-success truncate flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Answered &middot; {respondents.length}/{totalMembers} responded
          </span>
        ) : (
          <span className="flex-1 text-sm text-default-500 truncate">
            {prompt.text}
          </span>
        )}

        {!hasResponded && (
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        )}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-default-400 flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-3">
          {/* Category + full prompt text */}
          <div className="space-y-1.5">
            {prompt.category && (
              <Chip size="sm" variant="dot" className="text-xs">
                {prompt.category}
              </Chip>
            )}
            <p className="text-sm font-medium">{prompt.text}</p>
          </div>

          {/* Response input (only if not yet answered) */}
          {!hasResponded && (
            <div className="space-y-2">
              <Textarea
                placeholder="Your response..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                minRows={2}
                maxRows={4}
                classNames={{
                  inputWrapper: 'bg-default-200',
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  isDisabled={!responseText.trim()}
                >
                  Submit
                </Button>
              </div>
            </div>
          )}

          {/* Response count + respondent list (always shown when there are respondents) */}
          {respondents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-default-400">
                {hasResponded && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 text-success"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
                <span>
                  {respondents.length}/{totalMembers} members responded
                </span>
              </div>
              {respondentList}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
