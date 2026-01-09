import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { GroupDetail } from '../../types/groups';

interface ChatHeaderProps {
  group: GroupDetail;
  onMembersClick: () => void;
  onInviteClick: () => void;
  onLeaveClick: () => void;
}

export function ChatHeader({
  group,
  onMembersClick,
  onInviteClick,
  onLeaveClick,
}: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <Navbar maxWidth="full" className="border-b border-divider">
      <NavbarContent justify="start">
        <NavbarItem>
          <Button
            isIconOnly
            variant="light"
            onPress={() => navigate('/groups')}
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="center" className="flex-1">
        <NavbarItem className="flex items-center gap-2">
          <Avatar
            name={group.name.charAt(0).toUpperCase()}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{group.name}</span>
            <span className="text-xs text-default-400">
              {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly variant="light" aria-label="Menu">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                  />
                </svg>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Group actions">
              <DropdownItem key="members" onPress={onMembersClick}>
                View Members
              </DropdownItem>
              <DropdownItem key="invite" onPress={onInviteClick}>
                Invite People
              </DropdownItem>
              <DropdownItem
                key="leave"
                className="text-danger"
                color="danger"
                onPress={onLeaveClick}
              >
                Leave Group
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
