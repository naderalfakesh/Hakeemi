import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import { userProfileSchema } from '../domain/profile';

const FUNCTIONS_REGION = 'me-central1';

export async function bootstrapUserProfile() {
  const functions = getFunctions(getApp(), FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'bootstrapUserProfile');
  const response = await callable();

  return userProfileSchema.parse(response.data);
}
