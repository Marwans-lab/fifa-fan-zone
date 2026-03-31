export interface FanCard {
  teamId: string | null;
  photoDataUrl: string | null;
}

export interface AppState {
  fanCard: FanCard;
}
