import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Avatar,
  Chip,
  Listbox,
  ListboxItem,
} from '@heroui/react';
import { GroupMember } from '../../types/groups';

interface MemberListProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  currentUserId: string | undefined;
}

export function MemberList({
  isOpen,
  onClose,
  members,
  currentUserId,
}: MemberListProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>Group Members ({members.length})</ModalHeader>
        <ModalBody className="pb-6">
          <Listbox aria-label="Members">
            {members.map((member) => (
              <ListboxItem
                key={member.id}
                startContent={
                  <Avatar
                    name={member.displayName?.charAt(0).toUpperCase() || '?'}
                    src={member.avatarUrl || undefined}
                    size="sm"
                  />
                }
                endContent={
                  <div className="flex gap-2">
                    {member.role === 'owner' && (
                      <Chip size="sm" color="warning" variant="flat">
                        Owner
                      </Chip>
                    )}
                    {member.userId === currentUserId && (
                      <Chip size="sm" color="primary" variant="flat">
                        You
                      </Chip>
                    )}
                  </div>
                }
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {member.displayName || member.handle || 'Unknown'}
                  </span>
                  {member.handle && member.displayName && (
                    <span className="text-xs text-default-400">
                      @{member.handle}
                    </span>
                  )}
                </div>
              </ListboxItem>
            ))}
          </Listbox>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
