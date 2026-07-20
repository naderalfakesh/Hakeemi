import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from '@react-native-firebase/firestore';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

import type { AppointmentRepository } from '../domain/repository';
import { bookAppointmentResultSchema, mapAppointmentDocument } from '../domain/schemas';
import type { BookAppointmentInput } from '../domain/types';

const FUNCTIONS_REGION = 'me-central1';

function getUserId() {
  const userId = getAuth(getApp()).currentUser?.uid;

  if (!userId) {
    throw new Error('An authenticated account is required to access appointments.');
  }

  return userId;
}

class FirebaseAppointmentRepository implements AppointmentRepository {
  public async book(input: BookAppointmentInput) {
    const callable = httpsCallable(getFunctions(getApp(), FUNCTIONS_REGION), 'bookAppointment');
    const response = await callable(input);

    return bookAppointmentResultSchema.parse(response.data);
  }

  public async getAppointment(id: string) {
    getUserId();
    const snapshot = await getDoc(doc(getFirestore(getApp()), 'appointments', id));
    return snapshot.exists() ? mapAppointmentDocument(snapshot.id, snapshot.data()) : null;
  }

  public async listAppointments() {
    const patientId = getUserId();
    const snapshot = await getDocs(
      query(
        collection(getFirestore(getApp()), 'appointments'),
        where('patientId', '==', patientId),
        where('status', '==', 'confirmed'),
        orderBy('startsAt', 'asc'),
        limit(50),
      ),
    );

    return snapshot.docs.map((document) => mapAppointmentDocument(document.id, document.data()));
  }
}

export const appointmentRepository: AppointmentRepository = new FirebaseAppointmentRepository();
