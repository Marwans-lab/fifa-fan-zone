export interface FanCard {
  teamId: string | null;
  photoDataUrl: string | null;
}

export interface QuizResult {
  score: number;
  total: number;
  completedAt: string;
}

export interface AppState {
  fanCard: FanCard;
  points: number;
  quizResults: Record<string, QuizResult>;
  hasVisitedLeaderboard: boolean;
}
