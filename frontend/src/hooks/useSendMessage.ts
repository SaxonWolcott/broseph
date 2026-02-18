import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Message, MessageListResponse, SendMessageRequest } from '../types/messages';
import { JobAcceptedResponse } from '../types/groups';
import { messagesQueryKey } from './useMessages';
import { useImageUpload } from './useImageUpload';

async function postMessage(
  accessToken: string,
  groupId: string,
  body: SendMessageRequest,
): Promise<JobAcceptedResponse> {
  const response = await fetch(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to send message');
  }

  return response.json();
}

interface SendMessageParams {
  groupId: string;
  content: string;
  imageFiles?: File[];
  promptResponseId?: string;
  replyInChat?: boolean;
  replyToId?: string;
}

/**
 * Hook to send a message with optimistic updates.
 * Supports multiple image attachments: uploads all images first,
 * then sends ONE message with imageUrls + content.
 */
export function useSendMessage() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;
  const { uploadImages } = useImageUpload();

  return useMutation({
    mutationFn: async ({ groupId, content, imageFiles, promptResponseId, replyInChat, replyToId }: SendMessageParams) => {
      const body: SendMessageRequest = {};

      // Upload images if present
      if (imageFiles && imageFiles.length > 0) {
        const imageUrls = await uploadImages(imageFiles, groupId);
        body.imageUrls = imageUrls;
      }

      // Add text content if present
      if (content.trim()) {
        body.content = content.trim();
      }

      // Add reply context
      if (promptResponseId) {
        body.promptResponseId = promptResponseId;
        body.replyInChat = replyInChat;
      }
      if (replyToId) {
        body.replyToId = replyToId;
      }

      return postMessage(accessToken!, groupId, body);
    },

    onMutate: async ({ groupId, content, imageFiles }) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKey(groupId) });

      const previousMessages = queryClient.getQueryData<
        InfiniteData<MessageListResponse>
      >(messagesQueryKey(groupId));

      if (previousMessages && user) {
        // Create a single optimistic message with images + text
        const hasImages = imageFiles && imageFiles.length > 0;
        const hasContent = content.trim().length > 0;

        if (hasImages || hasContent) {
          const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            groupId,
            sender: {
              id: user.id,
              displayName: user.user_metadata?.display_name ?? null,
              handle: user.user_metadata?.handle ?? null,
              avatarUrl: user.user_metadata?.avatar_url ?? null,
            },
            content: hasContent ? content.trim() : '',
            imageUrls: hasImages ? imageFiles!.map((f) => URL.createObjectURL(f)) : null,
            type: 'message',
            createdAt: new Date().toISOString(),
            pending: true,
          };

          queryClient.setQueryData<InfiniteData<MessageListResponse>>(
            messagesQueryKey(groupId),
            {
              ...previousMessages,
              pages: previousMessages.pages.map((page, index) => {
                if (index === 0) {
                  return {
                    ...page,
                    messages: [optimisticMessage, ...page.messages],
                  };
                }
                return page;
              }),
            },
          );
        }
      }

      return { previousMessages, groupId };
    },

    onError: (_err, { groupId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messagesQueryKey(groupId),
          context.previousMessages,
        );
      }
    },

    onSettled: (_data, _error, { groupId, promptResponseId }) => {
      // Revoke any blob URLs from optimistic messages
      const currentData = queryClient.getQueryData<InfiniteData<MessageListResponse>>(
        messagesQueryKey(groupId),
      );
      if (currentData) {
        for (const page of currentData.pages) {
          for (const msg of page.messages) {
            if (msg.imageUrls) {
              for (const url of msg.imageUrls) {
                if (url.startsWith('blob:')) {
                  URL.revokeObjectURL(url);
                }
              }
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: messagesQueryKey(groupId) });
      if (promptResponseId) {
        queryClient.invalidateQueries({ queryKey: ['prompts', 'responses', promptResponseId, 'replies'] });
        queryClient.invalidateQueries({ queryKey: ['prompts', 'group'] });
      }
    },
  });
}
