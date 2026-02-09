import { Card, CardBody, Chip } from '@heroui/react';
import { PendingPrompt } from '../../types/prompts';

interface PromptCardProps {
  pendingPrompt: PendingPrompt;
  onPress?: () => void;
}

/**
 * Card displaying a prompt that the user needs to respond to.
 * Shows the prompt text, group name, and category.
 */
export function PromptCard({ pendingPrompt, onPress }: PromptCardProps) {
  const { prompt, groupName } = pendingPrompt;

  return (
    <Card
      isPressable={!!onPress}
      onPress={onPress}
      className="w-full"
    >
      <CardBody className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Chip size="sm" variant="flat" color="primary">
            {groupName}
          </Chip>
          {prompt.category && (
            <Chip size="sm" variant="dot" color="default">
              {prompt.category}
            </Chip>
          )}
        </div>
        <p className="text-foreground font-medium">
          {prompt.text}
        </p>
      </CardBody>
    </Card>
  );
}
