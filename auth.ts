export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isAdmin: boolean;
  createdAt: string;
  isBanned: boolean;
  tempBannedUntil?: string;
  kickedAt?: string;
  discordId?: string;
  username?: string;
  discriminator?: string;
  bio?: string;
  bannerUrl?: string;
  badges?: string[];
  discordRoles?: string[];
  xp?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface UpdateProfileRequest {
  name?: string;
  profilePicture?: string;
  bio?: string;
  bannerUrl?: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  originalEmailCode: string;
  newEmailCode: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  kickReason?: string;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  requiresVerification?: boolean;
}

export interface UsersListResponse {
  success: boolean;
  users: User[];
}

export interface UserActionRequest {
  userId: string;
  action: "ban" | "unban" | "kick" | "tempban";
  duration?: number; // in hours for tempban
  reason?: string; // for kick reason
}
