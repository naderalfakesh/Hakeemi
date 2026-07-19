import { getApp } from '@react-native-firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from '@react-native-firebase/auth';

import { toAuthActionError } from '../domain/errors';
import type { AuthUser, SignInInput, SignUpInput } from '../domain/types';

function getFirebaseAuth() {
  return getAuth(getApp());
}

function mapUser(user: User): AuthUser {
  return {
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerified,
    id: user.uid,
  };
}

export async function signIn(input: SignInInput) {
  try {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );

    return mapUser(credential.user);
  } catch (error) {
    throw toAuthActionError(error);
  }
}

export async function signUp(input: SignUpInput) {
  try {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );

    await updateProfile(credential.user, { displayName: input.displayName });
    await sendEmailVerification(credential.user);

    return mapUser(credential.user);
  } catch (error) {
    throw toAuthActionError(error);
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    throw toAuthActionError(error);
  }
}

export async function resendVerificationEmail() {
  const user = getFirebaseAuth().currentUser;

  if (!user) {
    throw toAuthActionError({ code: 'auth/invalid-credential' });
  }

  try {
    await sendEmailVerification(user);
  } catch (error) {
    throw toAuthActionError(error);
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(getFirebaseAuth());
  } catch (error) {
    throw toAuthActionError(error);
  }
}
