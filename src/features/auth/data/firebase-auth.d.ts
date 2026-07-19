import type { AuthUser, SignInInput, SignUpInput } from '../domain/types';

export function getCurrentAuthUser(): Promise<AuthUser | null>;
export function observeAuthState(listener: (user: AuthUser | null) => void): () => void;
export function requestPasswordReset(email: string): Promise<void>;
export function resendVerificationEmail(): Promise<void>;
export function signIn(input: SignInInput): Promise<AuthUser>;
export function signOut(): Promise<void>;
export function signUp(input: SignUpInput): Promise<AuthUser>;
