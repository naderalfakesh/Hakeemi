import type { CareRepository } from '../domain/repository';
import { FirestoreCareRepository } from './firestore-care-repository.native';

export const careRepository: CareRepository = new FirestoreCareRepository();
