import { TestBed } from '@angular/core/testing';

import { defaultAppState } from '../models/app-state.model';
import { FLOW_IDS, type FlowId } from '../models/flow-id.model';
import { type QuizResult } from '../models/quiz-result.model';
import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;
  let storage: Record<string, string>;
  let getItemSpy: jasmine.Spy;
  let setItemSpy: jasmine.Spy;
  let removeItemSpy: jasmine.Spy;

  const STORAGE_KEY = 'fanzone_state';
  beforeEach(() => {
    storage = {};

    getItemSpy = spyOn(window.localStorage, 'getItem').and.callFake(
      (key: string): string | null => storage[key] ?? null
    );
    setItemSpy = spyOn(window.localStorage, 'setItem').and.callFake(
      (key: string, value: string): void => {
        storage[key] = value;
      }
    );
    removeItemSpy = spyOn(window.localStorage, 'removeItem').and.callFake(
      (key: string): void => {
        delete storage[key];
      }
    );

    TestBed.configureTestingModule({});
  });

  function createService(): StoreService {
    return TestBed.inject(StoreService);
  }

  it('provides default state and reads localStorage on creation', () => {
    service = createService();
    const state = service.state();

    expect(getItemSpy).toHaveBeenCalledOnceWith(STORAGE_KEY);
    expect(state.points).toBe(0);
    expect(state.fanCard).toEqual({
      teamId: null,
      photoDataUrl: null,
      answers: {},
      completedAt: null,
    });
    expect(state.quizResults).toEqual({});
    expect(state.completedFlows).toEqual([]);
  });

  it('deep-merges saved fanCard fields with defaults', () => {
    storage[STORAGE_KEY] = JSON.stringify({
      fanCard: {
        teamId: 'team-a',
      },
      points: 10,
    });

    service = createService();
    const state = service.state();

    expect(state.points).toBe(10);
    expect(state.fanCard).toEqual({
      teamId: 'team-a',
      photoDataUrl: null,
      answers: {},
      completedAt: null,
    });
  });

  it('updateFanCard merges patch and persists', () => {
    service = createService();

    service.updateFanCard({
      teamId: 'arg',
      answers: { motto: 'vamos' },
    });

    const state = service.state();
    expect(state.fanCard.teamId).toBe('arg');
    expect(state.fanCard.answers).toEqual({ motto: 'vamos' });
    expect(setItemSpy).toHaveBeenCalled();
  });

  it('addPoints increments points and persists', () => {
    service = createService();

    service.addPoints(15);
    service.addPoints(5);

    expect(service.state().points).toBe(20);
    expect(setItemSpy).toHaveBeenCalledTimes(2);
  });

  it('recordQuizResult stores score details with timestamp', () => {
    service = createService();
    const nowIso = '2026-03-31T18:00:00.000Z';
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date(nowIso));

      service.recordQuizResult('quiz-1', 3, 5);
      const result = service.state().quizResults['quiz-1'] as QuizResult | undefined;

      expect(result).toEqual({
        score: 3,
        total: 5,
        completedAt: nowIso,
      });
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('completeFlow adds unique completed flow IDs only once', () => {
    service = createService();
    const firstFlow = FLOW_IDS[0] as FlowId;

    service.completeFlow(firstFlow);
    service.completeFlow(firstFlow);

    expect(service.state().completedFlows).toEqual([firstFlow]);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('isFlowUnlocked follows sequential completion rules', () => {
    service = createService();

    expect(service.isFlowUnlocked(FLOW_IDS[0] as FlowId)).toBeTrue();
    expect(service.isFlowUnlocked(FLOW_IDS[1] as FlowId)).toBeFalse();

    service.completeFlow(FLOW_IDS[0] as FlowId);

    expect(service.isFlowUnlocked(FLOW_IDS[1] as FlowId)).toBeTrue();
  });

  it('isFlowCompleted checks completion list', () => {
    service = createService();
    const flow = FLOW_IDS[2] as FlowId;

    expect(service.isFlowCompleted(flow)).toBeFalse();

    service.completeFlow(flow);

    expect(service.isFlowCompleted(flow)).toBeTrue();
  });

  it('resetState restores defaults and removes persisted key', () => {
    service = createService();
    service.addPoints(10);
    service.updateFanCard({ teamId: 'qat' });

    service.resetState();

    expect(service.state()).toEqual(defaultAppState);
    expect(removeItemSpy).toHaveBeenCalledOnceWith(STORAGE_KEY);
  });
});
