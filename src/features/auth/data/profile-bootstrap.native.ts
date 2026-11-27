import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { FIREBASE_FUNCTIONS_REGION } from '@/services/firebase/constants';

import { userProfileSchema } from '../domain/profile';

export async function bootstrapUserProfile() {
  const functions = getFunctions(getApp(), FIREBASE_FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'bootstrapUserProfile');
  const response = await callable();

  return userProfileSchema.parse(response.data);
}
