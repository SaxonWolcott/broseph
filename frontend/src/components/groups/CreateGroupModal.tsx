import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@heroui/react';
import { useCreateGroup } from '../../hooks/useCreateGroup';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_NAME_LENGTH = 50;

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const createGroup = useCreateGroup();

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      await createGroup.mutateAsync({ name: name.trim() });
      setName('');
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setName('');
    createGroup.reset();
    onClose();
  };

  const isValid = name.trim().length > 0 && name.length <= MAX_NAME_LENGTH;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Create New Group</ModalHeader>
        <ModalBody>
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            description={`${name.length}/${MAX_NAME_LENGTH} characters`}
            isInvalid={name.length > MAX_NAME_LENGTH}
            errorMessage={name.length > MAX_NAME_LENGTH ? 'Name too long' : undefined}
          />
          {createGroup.isError && (
            <p className="text-sm text-danger">
              {createGroup.error?.message || 'Failed to create group'}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={createGroup.isPending}
            isDisabled={!isValid}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
