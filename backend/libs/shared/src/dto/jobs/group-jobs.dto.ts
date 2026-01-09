export interface CreateGroupJobDto {
  ownerId: string;
  name: string;
}

export interface CreateGroupJobResult {
  groupId: string;
}

export interface DeleteGroupJobDto {
  groupId: string;
  userId: string;
}

export interface DeleteGroupJobResult {
  deleted: boolean;
}
