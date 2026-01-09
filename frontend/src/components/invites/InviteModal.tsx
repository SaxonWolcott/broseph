import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Snippet,
} from '@heroui/react';
import { useCreateInvite } from '../../hooks/useCreateInvite';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

export function InviteModal({
  isOpen,
  onClose,
  groupId,
  groupName,
}: InviteModalProps) {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const createInvite = useCreateInvite();

  const handleGenerateLink = async () => {
    try {
      const result = await createInvite.mutateAsync({ groupId });
      const link = `${window.location.origin}/invite/${result.token}`;
      setInviteLink(link);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setInviteLink(null);
    createInvite.reset();
    onClose();
  };

  const handleCopy = async () => {
    if (inviteLink) {
      try {
        await navigator.clipboard.writeText(inviteLink);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = inviteLink;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Invite to {groupName}</ModalHeader>
        <ModalBody>
          {!inviteLink ? (
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                Generate an invite link to share with friends. The link will
                expire in 7 days.
              </p>
              {createInvite.isError && (
                <p className="text-sm text-danger">
                  {createInvite.error?.message || 'Failed to create invite'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                Share this link with your friends:
              </p>
              <Snippet
                symbol=""
                variant="bordered"
                className="w-full"
                onCopy={handleCopy}
              >
                {inviteLink}
              </Snippet>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {inviteLink ? 'Done' : 'Cancel'}
          </Button>
          {!inviteLink && (
            <Button
              color="primary"
              onPress={handleGenerateLink}
              isLoading={createInvite.isPending}
            >
              Generate Link
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
