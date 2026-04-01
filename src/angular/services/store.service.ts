import { computed, Injectable, signal } from '@angular/core';

import { AppState, defaultAppState } from '../models/app-state.model';
import { FanCard } from '../models/fan-card.model';
import { FLOW_IDS, FlowId } from '../models/flow-id.model';

const STORAGE_KEY = 'fanzone_state';

// Keep parity with React store: hard reload starts from a clean persisted state.
const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
if (navigationEntry?.type === 'reload') {
  localStorage.removeItem(STORAGE_KEY);
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppState;
    const saved = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultAppState,
      ...saved,
      fanCard: { ...defaultAppState.fanCard, ...(saved.fanCard ?? {}) },
    };
  } catch {
    return defaultAppState;
  }
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded — non-fatal
  }
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly _state = signal<AppState>(loadState());
  readonly state = computed(() => this._state());

  updateFanCard(patch: Partial<FanCard>): void {
    this._setState(prev => ({ ...prev, fanCard: { ...prev.fanCard, ...patch } }));
  }

  addPoints(pointsToAdd: number): void {
    this._setState(prev => ({ ...prev, points: prev.points + pointsToAdd }));
  }

  recordQuizResult(quizId: string, score: number, total: number): void {
    this._setState(prev => ({
      ...prev,
      quizResults: {
        ...prev.quizResults,
        [quizId]: { score, total, completedAt: new Date().toISOString() },
      },
    }));
  }

  completeFlow(flowId: FlowId): void {
    this._setState(prev => {
      if (prev.completedFlows.includes(flowId)) return prev;
      return { ...prev, completedFlows: [...prev.completedFlows, flowId] };
    });
  }

  markLeaderboardVisited(): void {
    this._setState(prev => {
      if (prev.hasVisitedLeaderboard) {
        return prev;
      }
      return { ...prev, hasVisitedLeaderboard: true };
    });
  }

  isFlowUnlocked(flowId: FlowId): boolean {
    const index = FLOW_IDS.indexOf(flowId);
    if (index === 0) return true;
    const previousFlow = FLOW_IDS[index - 1];
    return this._state().completedFlows.includes(previousFlow);
  }

  isFlowCompleted(flowId: FlowId): boolean {
    return this._state().completedFlows.includes(flowId);
  }

  resetState(): void {
    this._state.set(defaultAppState);
    localStorage.removeItem(STORAGE_KEY);
  }

  private _setState(updater: (previousState: AppState) => AppState): void {
    const nextState = updater(this._state());
    this._state.set(nextState);
    saveState(nextState);
  }
}
