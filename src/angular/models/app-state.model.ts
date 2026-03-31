import { type FanCard } from './fan-card.model';
import { type FlowId } from './flow-id.model';
import { type QuizResult } from './quiz-result.model';

export interface AppState {
  fanCard: FanCard;
  points: number;
  quizResults: Record<string, QuizResult>;
  completedFlows: FlowId[];
}

export const defaultAppState: AppState = {
  fanCard: {
    teamId: null,
    photoDataUrl: null,
    answers: {},
    completedAt: null,
  },
  points: 0,
  quizResults: {},
  completedFlows: [],
};
