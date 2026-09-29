export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface HikeCard {
  id: string;
  name: string;
  district: string;
  difficulty: string;
  distanceKm: number;
  mapsUrl: string;
  rarity: Rarity;
  blurb: string;
  imageUrl?: string;
}

export interface UserDoc {
  ownedCardIds: string[];
  lastDrawDate: string | null;
  lastDrawIds: string[];
  displayName?: string;
  email?: string;
  updatedAt?: string;
}
