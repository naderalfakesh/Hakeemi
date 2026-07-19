import type { CareRepository } from '../domain/repository';
import { fixtureCareRepository } from './fixture-care-repository';

// The static portfolio export has no native Firebase runtime. It intentionally
// renders the same fictional catalogue through the local repository adapter.
export const careRepository: CareRepository = fixtureCareRepository;
