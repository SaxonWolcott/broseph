import { Card, CardBody, Avatar, Badge } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { GroupListItem } from '../../types/groups';

interface GroupCardProps {
  group: GroupListItem;
}

function formatTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export function GroupCard({ group }: GroupCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/groups/${group.id}`);
  };

  return (
    <Card
      isPressable
      onPress={handleClick}
      className="w-full"
    >
      <CardBody className="flex flex-row items-center gap-3 p-3">
        <Avatar
          name={group.name.charAt(0).toUpperCase()}
          size="lg"
          className="flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {group.name}
            </h3>
            {group.lastMessageAt && (
              <span className="text-xs text-default-400 flex-shrink-0">
                {formatTime(group.lastMessageAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              content={group.memberCount}
              size="sm"
              color="default"
              variant="flat"
            >
              <span className="text-xs text-default-400">members</span>
            </Badge>
          </div>
          {group.lastMessageContent && (
            <p className="text-sm text-default-500 truncate mt-1">
              {group.lastMessageSenderName && (
                <span className="font-medium">
                  {group.lastMessageSenderName}:{' '}
                </span>
              )}
              {group.lastMessageContent}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
