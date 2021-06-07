import { User } from './types';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const usersCollection = firestore().collection<User>('Users');

const get = async (): Promise<User | undefined> => {
  const userId = auth().currentUser?.uid;
  const result = await usersCollection.doc(userId).get();
  return result.data();
};

const create = async (id: string, user: User): Promise<void> => {
  await usersCollection.doc(id).set(user);
};

const update = async (id: string, user: User): Promise<void> => {
  await usersCollection.doc(id).update({ ...user });
};

const list = async (): Promise<User[] | undefined> => {
  const result = await usersCollection.get();
  return result.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

export default { get, create, update, list };
