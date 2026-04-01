import { ParamMap } from '@angular/router';

export function buildRouteContext(paramMap: ParamMap): string {
  const params = paramMap.keys.map(key => `${key}=${paramMap.get(key) ?? ''}`);
  const historyState = (window.history.state ?? null) as Record<string, unknown> | null;
  const stateEntries = historyState
    ? Object.entries(historyState)
        .filter(([key, value]) => key !== 'navigationId' && value !== null && value !== undefined)
        .map(([key, value]) => `${key}=${String(value)}`)
    : [];

  const context: string[] = [];
  if (params.length > 0) {
    context.push(`params: ${params.join(', ')}`);
  }
  if (stateEntries.length > 0) {
    context.push(`state: ${stateEntries.join(', ')}`);
  }

  return context.join(' | ') || 'No route params or router state provided.';
}
