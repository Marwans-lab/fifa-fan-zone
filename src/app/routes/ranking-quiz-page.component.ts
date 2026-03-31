import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RoutePlaceholderComponent,
  RoutePlaceholderEntry,
} from '../components/route-placeholder.component';
import { readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-ranking-quiz-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Ranking quiz"
      description="Angular placeholder route for ranking quiz flow."
      path="/ranking-quiz"
      [entries]="entries"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingQuizPageComponent {
  readonly entries: ReadonlyArray<RoutePlaceholderEntry>;

  constructor(route: ActivatedRoute) {
    this.entries = [{ label: 'quizId', value: readQuizId(route) }];
  }
}
