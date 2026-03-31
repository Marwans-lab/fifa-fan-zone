import { ActivatedRoute } from '@angular/router';
import {
  QuizNavigationState,
  ResultsNavigationState,
  RouteHistoryState,
  TeamSelectionState,
} from '../types/navigation-state';

const FALLBACK_VALUE = 'not provided';

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function formatStringValue(value: string | undefined): string {
  return value ?? FALLBACK_VALUE;
}

function formatNumberValue(value: number | undefined): string {
  return value === undefined ? FALLBACK_VALUE : String(value);
}

export function readTeamId(route: ActivatedRoute): string {
  const paramTeamId = route.snapshot.paramMap.get('teamId') ?? undefined;
  const navigationState = asRecord(window.history.state) as TeamSelectionState;
  return formatStringValue(paramTeamId ?? navigationState.teamId);
}

export function readQuizId(route: ActivatedRoute): string {
  const paramQuizId = route.snapshot.paramMap.get('quizId') ?? undefined;
  const navigationState = asRecord(window.history.state) as QuizNavigationState;
  return formatStringValue(paramQuizId ?? navigationState.quizId);
}

export function readFlowId(): string {
  const navigationState = asRecord(window.history.state) as RouteHistoryState;
  const flowIdValue = navigationState.flowId;
  return formatStringValue(typeof flowIdValue === 'string' ? flowIdValue : undefined);
}

export function readResultsValues(): {
  score: string;
  total: string;
  quizTitle: string;
} {
  const navigationState = asRecord(window.history.state) as ResultsNavigationState;
  return {
    score: formatNumberValue(navigationState.score),
    total: formatNumberValue(navigationState.total),
    quizTitle: formatStringValue(navigationState.quizTitle),
  };
}
