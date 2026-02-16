import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { useMessages } from '../hooks/useMessages';
import { useSendMessage } from '../hooks/useSendMessage';
import { useLeaveGroup } from '../hooks/useLeaveGroup';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { useRealtimeMembers } from '../hooks/useRealtimeMembers';
import { useGroupPrompt } from '../hooks/useGroupPrompt';
import { useSubmitPromptResponse } from '../hooks/useSubmitPromptResponse';
import { ChatHeader, MessageList, MessageInput, PromptBanner } from '../components/chat';
import type { ReplyContext } from '../components/chat/MessageInput';
import { MemberList } from '../components/members';
import { InviteModal } from '../components/invites';

export default function GroupChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);

  const { data: group, isLoading: isGroupLoading, error: groupError } = useGroup(id);
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(id);
  const sendMessage = useSendMessage();
  const leaveGroup = useLeaveGroup();
  const { data: promptData } = useGroupPrompt(id);
  const submitPromptResponse = useSubmitPromptResponse();

  // Real-time subscriptions for instant updates
  useRealtimeMessages(id);
  useRealtimeMembers(id);

  const handleReplyToPromptResponse = useCallback((responseId: string, senderName: string, replyInChat: boolean) => {
    setReplyContext({ responseId, senderName, replyInChat });
  }, []);

  const handleReplyToMessage = useCallback((message: import('../types/messages').Message) => {
    setReplyContext({
      messageId: message.id,
      senderName: message.sender?.displayName || message.sender?.handle || 'Unknown',
      previewContent: message.content.length > 60 ? message.content.slice(0, 60) + '...' : message.content,
    });
  }, []);

  const handleSendMessage = (content: string) => {
    if (!id) return;
    sendMessage.mutate({
      groupId: id,
      content,
      promptResponseId: replyContext?.responseId,
      replyInChat: replyContext?.replyInChat,
      replyToId: replyContext?.messageId,
    });
    setReplyContext(null);
  };

  const handleLeaveGroup = async () => {
    if (!id) return;
    try {
      await leaveGroup.mutateAsync(id);
      navigate('/groups');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isGroupLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-4">
            {groupError?.message || 'Group not found'}
          </p>
          <Button onPress={() => navigate('/groups')}>Back to Groups</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader
        group={group}
        onMembersClick={() => setIsMembersOpen(true)}
        onInviteClick={() => setIsInviteOpen(true)}
        onLeaveClick={() => setIsLeaveConfirmOpen(true)}
      />

      {promptData && (
        <PromptBanner
          prompt={promptData.prompt}
          hasResponded={promptData.hasResponded}
          respondents={promptData.respondents}
          totalMembers={group.memberCount}
          onSubmitResponse={(content) =>
            submitPromptResponse.mutate({ groupId: group.id, content })
          }
          isSubmitting={submitPromptResponse.isPending}
          onReplyToResponse={handleReplyToPromptResponse}
        />
      )}

      <MessageList
        data={messagesData}
        isLoading={isMessagesLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage ?? false}
        fetchNextPage={fetchNextPage}
        onReplyToPromptResponse={handleReplyToPromptResponse}
        onReplyToMessage={handleReplyToMessage}
      />

      <MessageInput
        onSend={handleSendMessage}
        isLoading={sendMessage.isPending}
        replyContext={replyContext}
        onCancelReply={() => setReplyContext(null)}
      />

      {/* Members Modal */}
      <MemberList
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        members={group.members}
        currentUserId={user?.id}
      />

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        groupId={group.id}
        groupName={group.name}
      />

      {/* Leave Confirmation Modal */}
      <Modal isOpen={isLeaveConfirmOpen} onClose={() => setIsLeaveConfirmOpen(false)}>
        <ModalContent>
          <ModalHeader>Leave Group</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to leave "{group.name}"?</p>
            {group.members.length === 1 && (
              <p className="text-warning text-sm mt-2">
                You are the only member. Leaving will delete this group.
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsLeaveConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleLeaveGroup}
              isLoading={leaveGroup.isPending}
            >
              Leave
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
