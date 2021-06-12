import { Doctor } from './types';

import firestore from '@react-native-firebase/firestore';

const doctorsCollection = firestore().collection<Doctor>('Doctors');

const get = async (id: string): Promise<Doctor | undefined> => {
  const result = await doctorsCollection.doc(id).get();
  return result.data();
};

const list = async (): Promise<Doctor[] | undefined> => {
  const result = await doctorsCollection.get();
  return result.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

const availability = () => {
  return [
    { id: 'id', startDate: '2011-01-01', endDate: '2011-01-01' },
    { id: 'id', startDate: '2011-01-01', endDate: '2011-01-01' },
  ];
};

export default { get, list, availability };
