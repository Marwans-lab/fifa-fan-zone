import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';
import { readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-drag-drop-quiz-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Drag and drop quiz"
      description="Placeholder for the Angular drag-and-drop quiz page."
      path="/drag-drop-quiz"
      [entries]="entries"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropQuizPageComponent {
  readonly entries: ReadonlyArray<{ label: string; value: string }>;

  constructor(route: ActivatedRoute) {
    this.entries = [{ label: 'quizId', value: readQuizId(route) }];
  }
}
