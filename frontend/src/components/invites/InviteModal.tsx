import { useState, FormEvent } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
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
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const createInvite = useCreateInvite();

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await createInvite.mutateAsync({ groupId, email });
      setSent(true);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    createInvite.reset();
    onClose();
  };

  const handleSendAnother = () => {
    setEmail('');
    setSent(false);
    createInvite.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Invite to {groupName}</ModalHeader>
        <ModalBody>
          {!sent ? (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <p className="text-sm text-default-500">
                Enter an email address to send an invite. They'll receive a link
                to join {groupName}.
              </p>
              <Input
                type="email"
                label="Email address"
                placeholder="friend@example.com"
                value={email}
                onValueChange={setEmail}
                isRequired
                autoFocus
              />
              {createInvite.isError && (
                <p className="text-sm text-danger">
                  {createInvite.error?.message || 'Failed to send invite'}
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="text-4xl">✉️</div>
              <p className="text-default-600">
                Invite sent to <strong>{email}</strong>
              </p>
              <p className="text-sm text-default-500">
                They'll receive an email with a link to join {groupName}.
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {!sent ? (
            <>
              <Button variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={() =>
                  handleSendInvite({ preventDefault: () => {} } as FormEvent)
                }
                isLoading={createInvite.isPending}
                isDisabled={!email}
              >
                Send Invite
              </Button>
            </>
          ) : (
            <>
              <Button variant="light" onPress={handleSendAnother}>
                Send Another
              </Button>
              <Button color="primary" onPress={handleClose}>
                Done
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
