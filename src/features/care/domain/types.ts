export type LocalizedText = {
  ar: string;
  en: string;
};

export type VisitMode = 'in_person' | 'video';

export type Money = {
  amount: number;
  currency: 'AED';
};

export type RatingSummary = {
  average: number;
  count: number;
};

export type ProviderImage = {
  alt: string;
  blurhash: string;
  url: string;
};

export type Provider = {
  bio: string;
  clinicIds: readonly string[];
  consultationFee: Money | null;
  credentialSummary: string;
  displayName: string;
  id: string;
  image: ProviderImage | null;
  isActive: boolean;
  isFeatured: boolean;
  languages: readonly string[];
  ratingSummary: RatingSummary | null;
  slug: string;
  specialtyIds: readonly string[];
  visitModes: readonly VisitMode[];
};

export type Specialty = {
  description: LocalizedText;
  icon: string;
  id: string;
  isActive: boolean;
  name: LocalizedText;
  sortOrder: number;
};

export type Clinic = {
  address: LocalizedText;
  city: LocalizedText;
  id: string;
  isActive: boolean;
  name: LocalizedText;
  timezone: string;
};

export type AvailabilitySlot = {
  clinicId: string | null;
  endsAt: string;
  id: string;
  providerId: string;
  startsAt: string;
  status: 'available';
  timezone: string;
  visitMode: VisitMode;
};

export type AvailabilityWindow = {
  endsBefore: string;
  startsAtOrAfter: string;
};

export type ProviderSearch = {
  query?: string;
  specialtyId?: string;
};
