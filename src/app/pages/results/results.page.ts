import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import type { ResultsRouteState } from '../../types/navigation-state'

@Component({
  selector: 'app-results-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="results" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Results</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">quizId: {{ quizId ?? "not provided" }}</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">score: {{ score ?? "not provided" }}</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">totalQuestions: {{ totalQuestions ?? "not provided" }}</p>
    </main>
  `,
})
export class ResultsPage {
  private readonly router = inject(Router)
  private readonly state = (this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {}) as ResultsRouteState
  readonly quizId = typeof this.state.quizId === 'string' ? this.state.quizId : null
  readonly score = typeof this.state.score === 'number' ? this.state.score : null
  readonly totalQuestions = typeof this.state.totalQuestions === 'number' ? this.state.totalQuestions : null
}
