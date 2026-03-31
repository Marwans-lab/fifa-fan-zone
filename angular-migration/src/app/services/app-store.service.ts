import { Injectable, signal } from '@angular/core';
import { AppState, FanCard, FLOW_IDS, FlowId, QuizResult } from '../models/fan-card.model';

const STORAGE_KEY = 'fanzone_state_angular';

const DEFAULT_STATE: AppState = {
  fanCard: {
    teamId: null,
    photoDataUrl: null,
    answers: {},
    completedAt: null,
  },
  points: 0,
  quizResults: {},
  completedFlows: [],
  hasVisitedLeaderboard: false,
};

@Injectable({ providedIn: 'root' })
export class AppStoreService {
  private readonly _state = signal<AppState>(this.loadState());
  readonly state = this._state.asReadonly();

  updateFanCard(patch: Partial<FanCard>): void {
    const next: AppState = {
      ...this._state(),
      fanCard: {
        ...this._state().fanCard,
        ...patch,
      },
    };
    this._state.set(next);
    this.saveState(next);
  }

  addPoints(pointsToAdd: number): void {
    const next: AppState = {
      ...this._state(),
      points: this._state().points + pointsToAdd,
    };
    this._state.set(next);
    this.saveState(next);
  }

  recordQuizResult(flowId: FlowId, result: Omit<QuizResult, 'completedAt'>): void {
    const next: AppState = {
      ...this._state(),
      quizResults: {
        ...this._state().quizResults,
        [flowId]: {
          ...result,
          completedAt: new Date().toISOString(),
        },
      },
    };
    this._state.set(next);
    this.saveState(next);
  }

  completeFlow(flowId: FlowId): void {
    const current = this._state();
    if (current.completedFlows.includes(flowId)) {
      return;
    }
    const next: AppState = {
      ...current,
      completedFlows: [...current.completedFlows, flowId],
    };
    this._state.set(next);
    this.saveState(next);
  }

  isFlowUnlocked(flowId: FlowId): boolean {
    const index = FLOW_IDS.indexOf(flowId);
    if (index <= 0) {
      return true;
    }
    const previousFlow = FLOW_IDS[index - 1];
    return this._state().completedFlows.includes(previousFlow);
  }

  markLeaderboardVisited(): void {
    const current = this._state();
    if (current.hasVisitedLeaderboard) {
      return;
    }
    const next: AppState = {
      ...current,
      hasVisitedLeaderboard: true,
    };
    this._state.set(next);
    this.saveState(next);
  }

  private loadState(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULT_STATE;
      }
      const saved = JSON.parse(raw) as Partial<AppState>;
      return {
        ...DEFAULT_STATE,
        ...saved,
        fanCard: {
          ...DEFAULT_STATE.fanCard,
          ...(saved.fanCard ?? {}),
        },
      };
    } catch {
      return DEFAULT_STATE;
    }
  }

  private saveState(state: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota exceeded should not break the app.
    }
  }
}
