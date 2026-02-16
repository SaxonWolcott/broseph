import { useEffect, useRef, useState } from 'react';
import { Spinner, Button, Avatar } from '@heroui/react';
import { InfiniteData } from '@tanstack/react-query';
import { MessageListResponse, Message } from '../../types/messages';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';
import { PromptResponseCard } from './PromptResponseCard';
import { PromptResponseModal } from './PromptResponseModal';
import { useAuth } from '../../contexts/AuthContext';

interface MessageListProps {
  data: InfiniteData<MessageListResponse> | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onReplyToPromptResponse?: (responseId: string, senderName: string, replyInChat: boolean) => void;
  onReplyToMessage?: (message: Message) => void;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if there's a gap of 1+ hours between two timestamps,
 * indicating a new conversation session.
 */
function hasConversationGap(prev: string | null, current: string): boolean {
  if (!prev) return true; // First message always starts a conversation
  return new Date(current).getTime() - new Date(prev).getTime() >= ONE_HOUR_MS;
}

/**
 * Smart date+time formatter for conversation-start markers:
 * - Today: "Today, 4:11 PM"
 * - Yesterday: "Yesterday, 4:11 PM"
 * - Within 7 days: "Monday, 4:11 PM"
 * - Older (same year): "February 14, 4:11 PM"
 * - Different year: "February 14, 2025, 4:11 PM"
 */
function formatConversationStart(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isSameDay(date, now)) {
    return `Today, ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${time}`;
  }

  // Within the last 7 days — use weekday name
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (date > sevenDaysAgo) {
    const weekday = date.toLocaleDateString([], { weekday: 'long' });
    return `${weekday}, ${time}`;
  }

  // Older — use full date
  if (date.getFullYear() === now.getFullYear()) {
    const monthDay = date.toLocaleDateString([], { month: 'long', day: 'numeric' });
    return `${monthDay}, ${time}`;
  }

  // Different year
  const fullDate = date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
  return `${fullDate}, ${time}`;
}

/**
 * Ghost preview of the original prompt response, shown above reply-in-chat messages.
 * Mimics iMessage's quoted reply style with a connecting line.
 */
function ReplyGhost({
  promptData,
  isOwn,
  onClick,
}: {
  promptData: Message['promptData'];
  isOwn: boolean;
  onClick?: () => void;
}) {
  if (!promptData) return null;

  const name = promptData.responseSenderName || 'Unknown';
  const avatarLetter = name.charAt(0).toUpperCase();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[65%] ${isOwn ? 'mr-10' : 'ml-10'}`}>
        {/* Ghost card */}
        <div
          className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-default-100/50 opacity-70 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <Avatar
            name={avatarLetter}
            src={promptData.responseSenderAvatarUrl || undefined}
            size="sm"
            className="flex-shrink-0 w-5 h-5 text-[8px]"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-default-400 font-medium">{name}</span>
            <p className="text-[11px] text-default-400 line-clamp-2 leading-tight">
              {promptData.responseContent}
            </p>
          </div>
        </div>
        {/* Connecting line */}
        <div
          className={`h-2.5 w-0 border-l-2 border-default-300 ${
            isOwn ? 'ml-auto mr-4' : 'ml-4'
          }`}
        />
      </div>
    </div>
  );
}

/**
 * Ghost preview for a general message reply, shown above the replying message.
 * Clickable to scroll to the original message.
 */
function MessageReplyGhost({
  replyToPreview,
  isOwn,
  onClick,
}: {
  replyToPreview: Message['replyToPreview'];
  isOwn: boolean;
  onClick?: () => void;
}) {
  if (!replyToPreview) return null;

  const name = replyToPreview.senderName || 'Unknown';
  const avatarLetter = name.charAt(0).toUpperCase();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[65%] ${isOwn ? 'mr-10' : 'ml-10'}`}>
        <div
          className={`flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-default-100/50 opacity-70 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <Avatar
            name={avatarLetter}
            src={replyToPreview.senderAvatarUrl || undefined}
            size="sm"
            className="flex-shrink-0 w-5 h-5 text-[8px]"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-default-400 font-medium">{name}</span>
            <p className="text-[11px] text-default-400 line-clamp-2 leading-tight">
              {replyToPreview.content}
            </p>
          </div>
        </div>
        {/* Connecting line */}
        <div
          className={`h-2.5 w-0 border-l-2 border-default-300 ${
            isOwn ? 'ml-auto mr-4' : 'ml-4'
          }`}
        />
      </div>
    </div>
  );
}

export function MessageList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onReplyToPromptResponse,
  onReplyToMessage,
}: MessageListProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedResponse, setSelectedResponse] = useState<Message | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Brief highlight effect
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 1500);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.pages[0]?.messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Flatten messages from all pages
  const allMessages: Message[] =
    data?.pages.flatMap((page) => page.messages) ?? [];

  // Reverse to show oldest first (API returns newest first)
  const messages = [...allMessages].reverse();

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-default-400">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  const handleAction = (message: Message, replyInChat: boolean) => {
    if (message.promptResponseId && onReplyToPromptResponse) {
      const senderName = message.type === 'prompt_response'
        ? (message.sender?.displayName || 'Unknown')
        : (message.promptData?.responseSenderName || 'Unknown');
      onReplyToPromptResponse(message.promptResponseId, senderName, replyInChat);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2 flex flex-col"
    >
      {/* Load more button */}
      {hasNextPage && (
        <div className="flex justify-center py-2">
          <Button
            size="sm"
            variant="light"
            onPress={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
          >
            Load older messages
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex flex-col gap-2">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const isNewConversation = hasConversationGap(
            prevMessage?.createdAt ?? null,
            message.createdAt,
          );

          const conversationMarker = isNewConversation ? (
            <div className="flex justify-center py-2">
              <span className="text-xs text-default-400 bg-default-100 px-3 py-1 rounded-full">
                {formatConversationStart(message.createdAt)}
              </span>
            </div>
          ) : null;

          // Prompt response card
          if (message.type === 'prompt_response') {
            return (
              <div key={message.id} id={`msg-${message.id}`} className="transition-colors duration-500">
                {conversationMarker}
                <PromptResponseCard
                  message={message}
                  isOwn={message.sender?.id === user?.id}
                  onComment={() => handleAction(message, false)}
                  onReplyInChat={() => handleAction(message, true)}
                  onTap={() => setSelectedResponse(message)}
                />
              </div>
            );
          }

          // System message
          if (message.type === 'system') {
            return (
              <div key={message.id} id={`msg-${message.id}`} className="transition-colors duration-500">
                {conversationMarker}
                <SystemMessage message={message} />
              </div>
            );
          }

          // Regular message bubble
          const isOwn = message.sender?.id === user?.id;
          const isReplyInChat = message.type === 'message' && !!message.promptResponseId && !!message.promptData;
          const isMessageReply = message.type === 'message' && !!message.replyToId && !!message.replyToPreview;

          const prevNonSystem =
            prevMessage && prevMessage.type === 'message' ? prevMessage : null;
          const showAvatar =
            isReplyInChat || // Always show avatar after a ghost preview
            isMessageReply || // Always show avatar after a message reply ghost
            isNewConversation || // Always show avatar at conversation start
            !prevNonSystem ||
            prevNonSystem.sender?.id !== message.sender?.id;

          return (
            <div key={message.id} id={`msg-${message.id}`} className="transition-colors duration-500">
              {conversationMarker}
              {/* Ghost preview for reply-in-chat to prompt response */}
              {isReplyInChat && (
                <ReplyGhost
                  promptData={message.promptData!}
                  isOwn={isOwn}
                  onClick={() => {
                    // Find the prompt_response message that this replies to
                    const target = messages.find(
                      (m) => m.type === 'prompt_response' && m.promptResponseId === message.promptResponseId,
                    );
                    if (target) scrollToMessage(target.id);
                  }}
                />
              )}
              {/* Ghost preview for general message reply */}
              {isMessageReply && !isReplyInChat && (
                <MessageReplyGhost
                  replyToPreview={message.replyToPreview!}
                  isOwn={isOwn}
                  onClick={() => scrollToMessage(message.replyToId!)}
                />
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onReply={onReplyToMessage}
                isSelected={selectedMessageId === message.id}
                onSelect={setSelectedMessageId}
              />
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />

      {/* Prompt Response Modal */}
      <PromptResponseModal
        isOpen={!!selectedResponse}
        onClose={() => setSelectedResponse(null)}
        message={selectedResponse}
        onComment={() => {
          if (selectedResponse) {
            handleAction(selectedResponse, false);
          }
        }}
        onReplyInChat={() => {
          if (selectedResponse) {
            handleAction(selectedResponse, true);
          }
        }}
      />
    </div>
  );
}
