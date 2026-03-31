export interface FanCard {
  teamId: string | null;
  photoDataUrl: string | null;
  answers: Record<string, string>;
  completedAt: string | null;
}

export const defaultFanCard: FanCard = {
  teamId: null,
  photoDataUrl: null,
  answers: {},
  completedAt: null,
};
