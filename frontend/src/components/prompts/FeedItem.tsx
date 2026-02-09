import { Card, CardBody, Avatar, Chip } from '@heroui/react';
import { PromptResponse } from '../../types/prompts';
import { formatRelativeTime } from '../../utils/formatTime';

interface FeedItemProps {
  response: PromptResponse;
}

/**
 * Card displaying a prompt response from a friend in the feed.
 * Shows the user avatar, name, prompt question, their response, group, and time.
 */
export function FeedItem({ response }: FeedItemProps) {
  const { prompt, user, groupName, content, createdAt } = response;
  const displayName = user.displayName || 'Anonymous';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        {/* Header with user info and time */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            src={user.avatarUrl || undefined}
            name={initial}
            size="sm"
            showFallback
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {displayName}
            </p>
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" color="default">
                {groupName}
              </Chip>
              <span className="text-xs text-default-400">
                {formatRelativeTime(createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Prompt question */}
        <p className="text-sm text-default-500 mb-2 italic">
          "{prompt.text}"
        </p>

        {/* User's response */}
        <p className="text-foreground">
          {content}
        </p>
      </CardBody>
    </Card>
  );
}
