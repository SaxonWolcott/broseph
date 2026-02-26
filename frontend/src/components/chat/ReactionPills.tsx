import { Reaction } from '../../types/messages';

interface ReactionPillsProps {
  reactions: Reaction[];
  isOwn: boolean;
  onToggle: (emoji: string) => void;
}

export function ReactionPills({ reactions, isOwn, onToggle }: ReactionPillsProps) {
  if (reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
            r.hasReacted
              ? 'bg-primary/20 border border-primary/40 text-primary'
              : 'bg-default-100 border border-default-200 text-default-500 hover:bg-default-200'
          }`}
        >
          <span>{r.emoji}</span>
          <span className="text-[10px] font-medium">{r.count}</span>
        </button>
      ))}
    </div>
  );
}
