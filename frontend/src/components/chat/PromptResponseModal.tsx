import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
  Chip,
  Spinner,
  Divider,
} from '@heroui/react';
import { Message } from '../../types/messages';
import { usePromptResponseReplies } from '../../hooks/usePromptResponseReplies';

interface PromptResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onComment: () => void;
  onReplyInChat: () => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PromptResponseModal({
  isOpen,
  onClose,
  message,
  onComment,
  onReplyInChat,
}: PromptResponseModalProps) {
  const responseId = message?.promptResponseId ?? undefined;
  const { data: repliesData, isLoading: repliesLoading } = usePromptResponseReplies(
    isOpen ? responseId : undefined,
  );

  if (!message?.promptData) return null;

  const { promptData, sender } = message;
  const replies = repliesData?.replies ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
      size="full"
      placement="bottom"
      classNames={{
        wrapper: 'items-end',
        base: 'max-h-[80vh] rounded-t-2xl rounded-b-none m-0 sm:m-0',
      }}
    >
      <ModalContent>
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full bg-default-300" />
        </div>

        {/* Sticky header: prompt + original poster always visible */}
        <ModalHeader className="flex flex-col gap-2 pb-2">
          {/* Prompt */}
          <div className="space-y-1">
            {promptData.promptCategory && (
              <Chip size="sm" variant="dot" color="primary" className="text-xs">
                {promptData.promptCategory}
              </Chip>
            )}
            <p className="text-sm font-medium">{promptData.promptText}</p>
          </div>

          {/* Original poster + response */}
          <div className="flex gap-3">
            <Avatar
              name={sender?.displayName?.charAt(0).toUpperCase() || '?'}
              src={sender?.avatarUrl || undefined}
              size="sm"
              className="flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">
                  {sender?.displayName || 'Unknown'}
                </span>
                <span className="text-[10px] text-default-400">
                  {formatDateTime(message.createdAt)}
                </span>
              </div>
              {message.imageUrls && message.imageUrls.length > 0 ? (
                <img
                  src={message.imageUrls[0]}
                  alt="Response"
                  className="max-w-full max-h-[300px] rounded-xl object-cover mt-1 cursor-pointer"
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap break-words mt-1">
                  {promptData.responseContent}
                </p>
              )}
            </div>
          </div>
        </ModalHeader>

        <Divider />

        <ModalBody className="pt-3">
          {/* Replies section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-default-500 uppercase tracking-wide">
              Comments ({replies.length})
            </h4>

            {repliesLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : replies.length === 0 ? (
              <p className="text-xs text-default-400 text-center py-3">
                No comments yet. Be the first!
              </p>
            ) : (
              <div className="space-y-3">
                {replies.map((reply) => (
                  <div key={reply.id} className="flex gap-2">
                    <Avatar
                      name={reply.sender.displayName?.charAt(0).toUpperCase() || '?'}
                      src={reply.sender.avatarUrl || undefined}
                      size="sm"
                      className="flex-shrink-0 w-6 h-6"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-medium">
                          {reply.sender.displayName || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-default-400">
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs whitespace-pre-wrap break-words">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter className="pt-2 border-t border-divider flex-col gap-0">
          <button
            type="button"
            className="w-full text-sm text-primary hover:text-primary-400 transition-colors py-2"
            onClick={() => {
              onClose();
              onComment();
            }}
          >
            Write a comment...
          </button>
          <button
            type="button"
            className="w-full text-sm text-default-400 hover:text-primary transition-colors py-2 flex items-center justify-center gap-1.5"
            onClick={() => {
              onClose();
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
            Reply in chat...
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
