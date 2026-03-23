import { useState } from 'react';
import { Button, Avatar, Chip } from '@heroui/react';
import { PollData, PollOption, PollVoter } from '../../types/messages';

interface PollCardProps {
  pollData: PollData;
  isCreator: boolean;
  onVote: (pollId: string, optionIds: string[]) => void;
  onClose: (pollId: string) => void;
  onAddOption?: (pollId: string, text: string) => void;
}

function VoterList({ voters }: { voters: PollVoter[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (voters.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        className="text-[10px] text-default-400 hover:text-default-300 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        {isExpanded ? 'Hide voters' : `${voters.length} voter${voters.length !== 1 ? 's' : ''}`}
      </button>
      {isExpanded && (
        <div className="mt-1 flex flex-wrap gap-1">
          {voters.map((v) => (
            <div key={v.userId} className="flex items-center gap-1">
              <Avatar
                name={(v.displayName || '?').charAt(0)}
                src={v.avatarUrl || undefined}
                size="sm"
                className="w-4 h-4 text-[8px]"
              />
              <span className="text-[10px] text-default-400">{v.displayName || 'Unknown'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClosedReasonText({ reason }: { reason: string | null }) {
  switch (reason) {
    case 'creator':
      return <span>Creator closed poll</span>;
    case 'time_limit':
      return <span>Time limit reached</span>;
    case 'all_voted':
      return <span>Everyone voted</span>;
    default:
      return <span>Poll closed</span>;
  }
}

function formatClosesAt(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) return 'Closing soon...';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 24) {
    if (diffHours === 0) return `Closes in ${diffMins}m`;
    return `Closes in ${diffHours}h ${diffMins}m`;
  }

  return `Closes at ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function PollCard({ pollData, isCreator, onVote, onClose, onAddOption }: PollCardProps) {
  const hasVoted = pollData.options.some((o) => o.hasVoted);
  // isChanging: user clicked "Change vote" and is selecting new options
  const [isChanging, setIsChanging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(pollData.options.filter((o) => o.hasVoted).map((o) => o.id)),
  );
  const [newOptionText, setNewOptionText] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);

  const totalVotes = pollData.options.reduce((sum, o) => sum + o.voteCount, 0);
  const winningOption = pollData.winningOptionId
    ? pollData.options.find((o) => o.id === pollData.winningOptionId)
    : null;

  // Options are locked when user has voted and is NOT in change mode
  const optionsLocked = pollData.closed || (hasVoted && !isChanging);

  const toggleOption = (optionId: string) => {
    if (optionsLocked) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (pollData.allowMultiple) {
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
      } else {
        next.clear();
        next.add(optionId);
      }
      return next;
    });
  };

  const handleCastVote = () => {
    if (selectedIds.size === 0) return;
    onVote(pollData.id, [...selectedIds]);
    setIsChanging(false);
  };

  const handleChangeVote = () => {
    // Enter change mode — pre-select current votes
    setSelectedIds(new Set(pollData.options.filter((o) => o.hasVoted).map((o) => o.id)));
    setIsChanging(true);
  };

  const handleCancelChange = () => {
    // Revert to current votes and exit change mode
    setSelectedIds(new Set(pollData.options.filter((o) => o.hasVoted).map((o) => o.id)));
    setIsChanging(false);
  };

  const handleAddOption = () => {
    const text = newOptionText.trim();
    if (!text || !onAddOption) return;
    onAddOption(pollData.id, text);
    setNewOptionText('');
    setShowAddOption(false);
  };

  const handleCancelAddOption = () => {
    setNewOptionText('');
    setShowAddOption(false);
  };

  return (
    <div className="bg-default-100 rounded-2xl p-3 min-w-[220px] max-w-[50vw] overflow-hidden">
      {/* Poll title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold break-words min-w-0">
          {pollData.title.slice(0, 80)}
        </h4>
        <Chip size="sm" variant="flat" className="text-[10px] flex-shrink-0">
          Poll
        </Chip>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        {pollData.options.map((option) => (
          <OptionRow
            key={option.id}
            option={option}
            isSelected={selectedIds.has(option.id)}
            isMultiple={pollData.allowMultiple}
            isClosed={pollData.closed}
            isLocked={optionsLocked}
            isWinner={option.id === pollData.winningOptionId}
            showVotes={pollData.showVotes}
            totalVotes={totalVotes}
            showResults={hasVoted || pollData.closed}
            onToggle={() => toggleOption(option.id)}
          />
        ))}
      </div>

      {/* Add option */}
      {!pollData.closed && pollData.allowAddOptions && (
        <div className="mt-2">
          {showAddOption ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                className="flex-1 text-xs bg-default-200 rounded-lg px-2 py-1.5 outline-none"
                placeholder="Add option..."
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddOption();
                  if (e.key === 'Escape') handleCancelAddOption();
                }}
                maxLength={100}
                autoFocus
              />
              <Button size="sm" variant="flat" onPress={handleAddOption} isDisabled={!newOptionText.trim()}>
                Add
              </Button>
              <button
                type="button"
                className="text-default-400 hover:text-default-300 flex-shrink-0 p-1"
                onClick={handleCancelAddOption}
                aria-label="Cancel add option"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs text-primary hover:text-primary-400 transition-colors"
              onClick={() => setShowAddOption(true)}
            >
              + Add option
            </button>
          )}
        </div>
      )}

      {/* Voting actions */}
      {!pollData.closed && (
        <div className="mt-2">
          {!hasVoted && !isChanging ? (
            // Haven't voted yet — show Cast vote
            <Button
              size="sm"
              color="primary"
              variant="flat"
              className="w-full"
              onPress={handleCastVote}
              isDisabled={selectedIds.size === 0}
            >
              Cast vote
            </Button>
          ) : hasVoted && !isChanging ? (
            // Voted and locked — show confirmation + change option
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-success">Vote casted</span>
              <Button
                size="sm"
                variant="light"
                className="w-full text-default-400"
                onPress={handleChangeVote}
              >
                Change vote
              </Button>
            </div>
          ) : (
            // In change mode — show Cast vote + Cancel
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                color="primary"
                variant="flat"
                className="w-full"
                onPress={handleCastVote}
                isDisabled={selectedIds.size === 0}
              >
                Cast vote
              </Button>
              <Button
                size="sm"
                variant="light"
                className="w-full text-default-400"
                onPress={handleCancelChange}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Creator close button */}
      {!pollData.closed && isCreator && (
        <button
          type="button"
          className="mt-1.5 text-[10px] text-danger hover:text-danger-400 transition-colors w-full text-center"
          onClick={() => onClose(pollData.id)}
        >
          Close poll
        </button>
      )}

      {/* Closes at indicator */}
      {!pollData.closed && pollData.closesAt && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-default-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {formatClosesAt(pollData.closesAt)}
        </div>
      )}

      {/* Closed state */}
      {pollData.closed && (
        <div className="mt-2 pt-2 border-t border-divider">
          <div className="flex items-center gap-1.5 text-xs text-default-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <ClosedReasonText reason={pollData.closedReason} />
          </div>
          {winningOption && (
            <p className="text-xs font-medium text-success mt-1">
              {winningOption.text} wins!
            </p>
          )}
        </div>
      )}

      {/* Vote count footer */}
      <div className="mt-1.5 text-[10px] text-default-400">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {pollData.totalVoters} voter{pollData.totalVoters !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function OptionRow({
  option,
  isSelected,
  isMultiple,
  isClosed,
  isLocked,
  isWinner,
  showVotes,
  totalVotes,
  showResults,
  onToggle,
}: {
  option: PollOption;
  isSelected: boolean;
  isMultiple: boolean;
  isClosed: boolean;
  isLocked: boolean;
  isWinner: boolean;
  showVotes: boolean;
  totalVotes: number;
  showResults: boolean;
  onToggle: () => void;
}) {
  const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;

  return (
    <div>
      <button
        type="button"
        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors relative overflow-hidden ${
          isClosed
            ? isWinner
              ? 'bg-success/20 border border-success/30'
              : 'bg-default-200/50'
            : isLocked
              ? isSelected
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-default-200/50'
              : isSelected
                ? 'bg-primary/20 border border-primary/40'
                : 'bg-default-200 hover:bg-default-300'
        }`}
        onClick={onToggle}
        disabled={isLocked}
      >
        {/* Progress bar background */}
        {showResults && totalVotes > 0 && (
          <div
            className={`absolute inset-0 rounded-xl ${isWinner ? 'bg-success/10' : 'bg-default-300/30'}`}
            style={{ width: `${percentage}%` }}
          />
        )}

        {/* Selection indicator */}
        <div className="relative z-10 flex-shrink-0">
          {isMultiple ? (
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              isSelected ? 'border-primary bg-primary' : 'border-default-400'
            }`}>
              {isSelected && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-2.5 h-2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </div>
          ) : (
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'border-primary' : 'border-default-400'
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          )}
        </div>

        {/* Option text */}
        <span className={`relative z-10 flex-1 text-xs whitespace-nowrap min-w-0 ${isWinner ? 'font-semibold text-success' : ''}`}>
          {option.text.slice(0, 40)}
        </span>

        {/* Vote count */}
        <span className="relative z-10 text-xs text-default-400 flex-shrink-0">
          {option.voteCount}{showResults && totalVotes > 0 ? ` (${percentage}%)` : ''}
        </span>
      </button>

      {/* Voter list */}
      {showVotes && option.voters && option.voters.length > 0 && (
        <div className="pl-7 mt-0.5">
          <VoterList voters={option.voters} />
        </div>
      )}
    </div>
  );
}
