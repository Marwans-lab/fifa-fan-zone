import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RoutePlaceholderComponent,
  RoutePlaceholderEntry,
} from '../components/route-placeholder.component';
import { readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-swipe-quiz-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Swipe quiz"
      description="Lazy-loaded Angular placeholder for the swipe quiz page."
      path="/swipe-quiz"
      [entries]="entries"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SwipeQuizPageComponent {
  readonly entries: ReadonlyArray<RoutePlaceholderEntry>;

  constructor(route: ActivatedRoute) {
    const quizId = readQuizId(route);
    this.entries = [{ label: 'quizId', value: quizId }];
  }
}
