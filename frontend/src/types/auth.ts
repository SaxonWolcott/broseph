export interface Profile {
  id: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicLinkRequest {
  email: string;
  redirectTo?: string;
}

export interface MagicLinkResponse {
  success: boolean;
  message?: string;
}

export interface OnboardRequest {
  displayName?: string;
  handle?: string;
}
