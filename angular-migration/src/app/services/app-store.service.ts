import { Injectable, signal } from '@angular/core';
import { AppState, FanCard, QuizResult } from '../models/fan-card.model';

const STORAGE_KEY = 'fanzone_state_angular';

const DEFAULT_STATE: AppState = {
  fanCard: {
    teamId: null,
    photoDataUrl: null,
  },
  points: 0,
  quizResults: {},
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
    if (!Number.isFinite(pointsToAdd)) {
      return;
    }
    const safePoints = Math.max(0, Math.round(pointsToAdd));
    const next: AppState = {
      ...this._state(),
      points: this._state().points + safePoints,
    };
    this._state.set(next);
    this.saveState(next);
  }

  recordQuizResult(quizId: string, result: Omit<QuizResult, 'completedAt'>): void {
    const trimmedQuizId = quizId.trim();
    if (!trimmedQuizId) {
      return;
    }
    const next: AppState = {
      ...this._state(),
      quizResults: {
        ...this._state().quizResults,
        [trimmedQuizId]: {
          score: result.score,
          total: result.total,
          completedAt: new Date().toISOString(),
        },
      },
    };
    this._state.set(next);
    this.saveState(next);
  }

  markLeaderboardVisited(): void {
    if (this._state().hasVisitedLeaderboard) {
      return;
    }
    const next: AppState = {
      ...this._state(),
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
