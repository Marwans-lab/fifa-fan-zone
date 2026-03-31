import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import type { QuizRouteState } from '../../types/navigation-state'

@Component({
  selector: 'app-card-match-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="card-match" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Card match quiz</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">quizId: {{ quizId ?? "not provided" }}</p>
    </main>
  `,
})
export class CardMatchPage {
  private readonly router = inject(Router)
  private readonly state = (this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {}) as QuizRouteState
  readonly quizId = typeof this.state.quizId === 'string' ? this.state.quizId : null
}
