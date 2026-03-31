export interface FanCard {
  teamId: string | null;
  photoDataUrl: string | null;
  answers: Record<string, string>;
  completedAt: string | null;
}

export const FLOW_IDS = [
  'the-connector',
  'the-architect',
  'the-historian',
  'the-referee',
  'the-retrospective',
] as const;

export type FlowId = (typeof FLOW_IDS)[number];

export interface QuizResult {
  score: number;
  total: number;
  completedAt: string;
}

export interface AppState {
  fanCard: FanCard;
  points: number;
  quizResults: Partial<Record<FlowId, QuizResult>>;
  completedFlows: FlowId[];
  hasVisitedLeaderboard: boolean;
}
