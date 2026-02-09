import { Message } from '../../types/messages';

interface SystemMessageProps {
  message: Message;
}

export function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center py-1">
      <span className="text-xs text-default-400">{message.content}</span>
    </div>
  );
}
