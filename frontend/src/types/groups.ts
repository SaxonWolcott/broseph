export interface Group {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupListItem extends Group {
  lastMessageContent: string | null;
  lastMessageSenderName: string | null;
  lastMessageAt: string | null;
}

export interface GroupMember {
  id: string;
  userId: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupListResponse {
  groups: GroupListItem[];
}

export interface CreateGroupRequest {
  name: string;
}

export interface JobAcceptedResponse {
  jobId: string;
  status: string;
}
