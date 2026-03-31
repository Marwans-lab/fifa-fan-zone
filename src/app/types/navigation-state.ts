export interface TeamSelectionState {
  teamId?: string;
}

export interface QuizNavigationState {
  quizId?: string;
}

export interface IdentityNavigationState {
  teamId?: string;
  photoDataUrl?: string;
}

export interface CardMatchNavigationState {
  quizId?: string;
  flowId?: string;
}

export interface ResultsNavigationState {
  score?: number;
  total?: number;
  quizTitle?: string;
  [key: string]: unknown;
}

type NavigationStateRecord = Record<string, unknown> | null | undefined;

export const EMPTY_NAVIGATION_STATE: Readonly<Record<string, never>> = Object.freeze({});

export const readNavigationState = <T extends Record<string, unknown>>(
  state: NavigationStateRecord,
): T => {
  if (!state || typeof state !== 'object') {
    return EMPTY_NAVIGATION_STATE as T;
  }

  return state as T;
};

export const printableNavigationValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return 'not provided';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return 'unserializable value';
  }
};
