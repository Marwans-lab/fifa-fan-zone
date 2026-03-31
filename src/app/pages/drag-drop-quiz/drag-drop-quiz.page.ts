import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import type { QuizRouteState } from '../../types/navigation-state'

@Component({
  selector: 'app-drag-drop-quiz-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="drag-drop-quiz" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Drag and drop quiz</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
      <p style="font: var(--f-brand-type-caption); color: var(--c-text-2);">quizId: {{ quizId ?? "not provided" }}</p>
    </main>
  `,
})
export class DragDropQuizPage {
  private readonly router = inject(Router)
  private readonly state = (this.router.getCurrentNavigation()?.extras.state ?? history.state ?? {}) as QuizRouteState
  readonly quizId = typeof this.state.quizId === 'string' ? this.state.quizId : null
}
