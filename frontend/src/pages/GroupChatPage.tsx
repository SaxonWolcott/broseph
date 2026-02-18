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
import { useImageUpload } from '../hooks/useImageUpload';
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
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

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
  const { uploadImage, isUploading } = useImageUpload();

  // Real-time subscriptions for instant updates
  useRealtimeMessages(id);
  useRealtimeMembers(id);

  const handleReplyToPromptResponse = useCallback((responseId: string, senderName: string, replyInChat: boolean) => {
    setReplyContext({ responseId, senderName, replyInChat });
  }, []);

  const handleReplyToMessage = useCallback((message: import('../types/messages').Message) => {
    const hasContent = message.content && message.content.length > 0;
    const imageCount = message.imageUrls?.length ?? 0;
    let previewContent: string;

    if (hasContent) {
      previewContent = message.content.length > 60 ? message.content.slice(0, 60) + '...' : message.content;
    } else if (imageCount === 1) {
      previewContent = '[Image]';
    } else if (imageCount > 1) {
      previewContent = `[${imageCount} images]`;
    } else {
      previewContent = '';
    }

    setReplyContext({
      messageId: message.id,
      senderName: message.sender?.displayName || message.sender?.handle || 'Unknown',
      previewContent,
    });
  }, []);

  const handleSendMessage = (content: string, imageFiles?: File[]) => {
    if (!id) return;
    sendMessage.mutate({
      groupId: id,
      content,
      imageFiles,
      promptResponseId: replyContext?.responseId,
      replyInChat: replyContext?.replyInChat,
      replyToId: replyContext?.messageId,
    });
    setReplyContext(null);
  };

  const handleImageExpand = useCallback((urls: string[], startIndex: number) => {
    setGalleryImages(urls);
    setGalleryIndex(startIndex);
  }, []);

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
          onSubmitResponse={async (content, imageFile) => {
            let imageUrl: string | undefined;
            if (imageFile) {
              imageUrl = await uploadImage(imageFile, group.id);
            }
            submitPromptResponse.mutate({ groupId: group.id, content, imageUrl });
          }}
          isSubmitting={isUploading || submitPromptResponse.isPending}
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
        onImageExpand={handleImageExpand}
      />

      <MessageInput
        onSend={handleSendMessage}
        isLoading={sendMessage.isPending}
        replyContext={replyContext}
        onCancelReply={() => setReplyContext(null)}
      />

      {/* Gallery Modal — Full-Screen Image Viewer */}
      <Modal
        isOpen={!!galleryImages}
        onClose={() => setGalleryImages(null)}
        size="full"
        classNames={{
          base: 'bg-black/95',
          closeButton: 'text-white hover:bg-white/20 z-50',
        }}
      >
        <ModalContent>
          <div
            className="flex items-center justify-center w-full h-full p-4 relative"
            onClick={() => setGalleryImages(null)}
          >
            {galleryImages && (
              <>
                <img
                  src={galleryImages[galleryIndex]}
                  alt={`Image ${galleryIndex + 1} of ${galleryImages.length}`}
                  className="max-w-full max-h-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Counter */}
                {galleryImages.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-3 py-1 rounded-full">
                    {galleryIndex + 1} / {galleryImages.length}
                  </div>
                )}

                {/* Left arrow */}
                {galleryIndex > 0 && (
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndex((prev) => prev - 1);
                    }}
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}

                {/* Right arrow */}
                {galleryIndex < galleryImages.length - 1 && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndex((prev) => prev + 1);
                    }}
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        </ModalContent>
      </Modal>

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
