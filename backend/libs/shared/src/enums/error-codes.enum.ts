export enum ErrorCode {
  // Group errors
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  GROUP_FULL = 'GROUP_FULL',
  GROUP_NAME_TOO_LONG = 'GROUP_NAME_TOO_LONG',
  GROUP_HAS_MEMBERS = 'GROUP_HAS_MEMBERS',

  // User/Member errors
  USER_GROUP_LIMIT = 'USER_GROUP_LIMIT',
  NOT_GROUP_MEMBER = 'NOT_GROUP_MEMBER',
  NOT_GROUP_OWNER = 'NOT_GROUP_OWNER',
  ALREADY_MEMBER = 'ALREADY_MEMBER',

  // Invite errors
  INVITE_NOT_FOUND = 'INVITE_NOT_FOUND',
  INVITE_EXPIRED = 'INVITE_EXPIRED',
  INVITE_ALREADY_USED = 'INVITE_ALREADY_USED',

  // Message errors
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  MESSAGE_EMPTY = 'MESSAGE_EMPTY',

  // Generic errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.GROUP_NOT_FOUND]: 'Group not found',
  [ErrorCode.GROUP_FULL]: 'This group has reached the maximum of 10 members',
  [ErrorCode.GROUP_NAME_TOO_LONG]: 'Group name cannot exceed 50 characters',
  [ErrorCode.GROUP_HAS_MEMBERS]: 'Cannot delete group that has other members',

  [ErrorCode.USER_GROUP_LIMIT]: "You've reached the maximum of 20 groups",
  [ErrorCode.NOT_GROUP_MEMBER]: "You're not a member of this group",
  [ErrorCode.NOT_GROUP_OWNER]: 'Only the group owner can perform this action',
  [ErrorCode.ALREADY_MEMBER]: "You're already a member of this group",

  [ErrorCode.INVITE_NOT_FOUND]: 'Invite not found',
  [ErrorCode.INVITE_EXPIRED]: 'This invite has expired',
  [ErrorCode.INVITE_ALREADY_USED]: 'This invite has already been used',

  [ErrorCode.MESSAGE_TOO_LONG]: 'Message cannot exceed 2000 characters',
  [ErrorCode.MESSAGE_EMPTY]: 'Message cannot be empty',

  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCode.VALIDATION_ERROR]: 'Invalid request data',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
};
