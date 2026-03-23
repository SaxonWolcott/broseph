export interface CreatePollJobDto {
  groupId: string;
  creatorId: string;
  title: string;
  options: { text: string }[];
  settings: {
    allowMultiple: boolean;
    showVotes: boolean;
    allowAddOptions: boolean;
    declareWinnerOnAllVoted: boolean;
    closesAt?: string;
  };
}

export interface CreatePollJobResult {
  messageId: string;
  pollId: string;
}

export interface ClosePollJobDto {
  pollId: string;
  reason: 'time_limit';
}
