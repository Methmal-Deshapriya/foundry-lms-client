import type { Role } from "@/lib/constants";
import type { Permission } from "@/lib/access";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  permissions: Permission[];
  emailVerified: boolean;
  phone?: string | null;
  address?: string | null;
  district?: string | null;
  dateOfBirth?: string | null;
  alStream?: string | null;
  createdAt: string;
  updatedAt: string;
  verificationEmailSent?: boolean;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginChallenge = {
  requiresMfa: true;
  challengeId: string;
  expiresAt: string;
};

export type LoginResult = User | LoginChallenge;

export type VerifyLoginChallengeRequest = {
  challengeId: string;
  code: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  district: string;
  dateOfBirth: string;
  alStream: string;
};

export type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  district?: string;
  dateOfBirth?: string;
  alStream?: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type VerifyOtpRequest = {
  email: string;
  code: string;
};

export type ResendOtpRequest = {
  email: string;
};
