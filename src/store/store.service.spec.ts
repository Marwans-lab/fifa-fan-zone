import { FLOW_IDS, StoreService } from './store.service';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

type NavigationType = 'navigate' | 'reload';

interface TestCase {
  name: string;
  run: () => void;
}

const STORAGE_KEY = 'fanzone_state';
const tests: TestCase[] = [];

function test(name: string, run: () => void): void {
  tests.push({ name, run });
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function withBrowserMocks(
  navType: NavigationType,
  preload?: string,
): { service: StoreService; storage: Storage } {
  const storage = new MemoryStorage();

  if (preload !== undefined) {
    storage.setItem(STORAGE_KEY, preload);
  }

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, 'performance', {
    value: {
      getEntriesByType: (entryType: string) => {
        if (entryType !== 'navigation') {
          return [];
        }

        return [{ type: navType }];
      },
    },
    configurable: true,
    writable: true,
  });

  return { service: new StoreService(), storage };
}

test('initializes with default state when storage is empty', () => {
  const { service } = withBrowserMocks('navigate');
  const state = service.state();

  assert(state.points === 0, 'points should default to 0');
  assert(state.fanCard.teamId === null, 'teamId should default to null');
  assert(state.fanCard.photoDataUrl === null, 'photoDataUrl should default to null');
  assert(state.fanCard.completedAt === null, 'completedAt should default to null');
  assert(Object.keys(state.fanCard.answers).length === 0, 'answers should default to empty');
  assert(Object.keys(state.quizResults).length === 0, 'quizResults should default to empty');
  assert(state.completedFlows.length === 0, 'completedFlows should default to empty');
});

test('loads and deep-merges persisted fanCard state', () => {
  const persisted = JSON.stringify({
    fanCard: {
      teamId: 'argentina',
    },
    points: 12,
  });

  const { service } = withBrowserMocks('navigate', persisted);
  const state = service.state();

  assert(state.points === 12, 'points should load from persisted state');
  assert(state.fanCard.teamId === 'argentina', 'teamId should load from persisted state');
  assert(state.fanCard.photoDataUrl === null, 'fanCard merge should preserve defaults');
  assert(Object.keys(state.fanCard.answers).length === 0, 'fanCard answers should preserve defaults');
});

test('updateFanCard and addPoints mutate state and persist', () => {
  const { service, storage } = withBrowserMocks('navigate');

  service.updateFanCard({
    teamId: 'qatar',
    photoDataUrl: 'data:image/png;base64,abc',
  });
  service.addPoints(20);

  const state = service.state();
  const persistedRaw = storage.getItem(STORAGE_KEY);
  assert(persistedRaw !== null, 'state should persist to localStorage');

  const persisted = JSON.parse(persistedRaw ?? '{}') as {
    fanCard?: { teamId?: string };
    points?: number;
  };

  assert(state.fanCard.teamId === 'qatar', 'teamId should be updated');
  assert(state.points === 20, 'points should be incremented');
  assert(persisted.fanCard?.teamId === 'qatar', 'persisted teamId should match');
  assert(persisted.points === 20, 'persisted points should match');
});

test('recordQuizResult writes quiz entry with completion timestamp', () => {
  const { service } = withBrowserMocks('navigate');

  service.recordQuizResult('quiz-1', 8, 10);
  const quiz = service.state().quizResults['quiz-1'];

  assert(quiz.score === 8, 'quiz score should be persisted');
  assert(quiz.total === 10, 'quiz total should be persisted');
  assert(
    typeof quiz.completedAt === 'string' && quiz.completedAt.length > 0,
    'quiz completion timestamp should be set',
  );
});

test('completeFlow tracks completion and unlocks next flow without duplicates', () => {
  const { service } = withBrowserMocks('navigate');
  const firstFlow = FLOW_IDS[0];
  const secondFlow = FLOW_IDS[1];

  assert(service.isFlowUnlocked(firstFlow), 'first flow should always be unlocked');
  assert(!service.isFlowUnlocked(secondFlow), 'second flow should be locked before first completion');

  service.completeFlow(firstFlow);
  service.completeFlow(firstFlow);

  const state = service.state();
  assert(state.completedFlows.length === 1, 'completed flow should not be duplicated');
  assert(service.isFlowCompleted(firstFlow), 'first flow should be marked completed');
  assert(service.isFlowUnlocked(secondFlow), 'second flow should unlock after first completion');
});

test('resetState restores defaults and clears persistence', () => {
  const { service, storage } = withBrowserMocks('navigate');

  service.updateFanCard({ teamId: 'spain' });
  service.addPoints(5);
  service.completeFlow(FLOW_IDS[0]);

  service.resetState();

  const state = service.state();
  assert(state.points === 0, 'points should reset to 0');
  assert(state.fanCard.teamId === null, 'fan card should reset to defaults');
  assert(state.completedFlows.length === 0, 'completed flows should reset to empty');
  assert(storage.getItem(STORAGE_KEY) === null, 'persisted state should be cleared');
});

test('reload navigation clears persisted state before initialization', () => {
  const persisted = JSON.stringify({ points: 999 });
  const { service, storage } = withBrowserMocks('reload', persisted);

  assert(service.state().points === 0, 'reload should ignore persisted points');
  assert(storage.getItem(STORAGE_KEY) === null, 'reload should clear persisted storage key');
});

function runTests(): void {
  let passed = 0;

  for (const currentTest of tests) {
    currentTest.run();
    passed += 1;
  }

  console.log(`StoreService tests passed: ${passed}/${tests.length}`);
}

runTests();
