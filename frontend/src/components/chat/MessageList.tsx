import { useEffect, useRef } from 'react';
import { Spinner, Button } from '@heroui/react';
import { InfiniteData } from '@tanstack/react-query';
import { MessageListResponse, Message } from '../../types/messages';
import { MessageBubble } from './MessageBubble';
import { SystemMessage } from './SystemMessage';
import { useAuth } from '../../contexts/AuthContext';

interface MessageListProps {
  data: InfiniteData<MessageListResponse> | undefined;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

function isSameDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) {
    return 'Today';
  } else if (isSameDay(dateString, yesterday.toISOString())) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }
}

export function MessageList({
  data,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
}: MessageListProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
          const isSystem = message.type === 'system';
          const showDateSeparator =
            !prevMessage || !isSameDay(message.createdAt, prevMessage.createdAt);

          if (isSystem) {
            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center py-2">
                    <span className="text-xs text-default-400 bg-default-100 px-3 py-1 rounded-full">
                      {formatDateSeparator(message.createdAt)}
                    </span>
                  </div>
                )}
                <SystemMessage message={message} />
              </div>
            );
          }

          const prevNonSystem =
            prevMessage && prevMessage.type !== 'system' ? prevMessage : null;
          const showAvatar =
            !prevNonSystem ||
            prevNonSystem.sender?.id !== message.sender?.id ||
            showDateSeparator;

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex justify-center py-2">
                  <span className="text-xs text-default-400 bg-default-100 px-3 py-1 rounded-full">
                    {formatDateSeparator(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={message.sender?.id === user?.id}
                showAvatar={showAvatar}
              />
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
