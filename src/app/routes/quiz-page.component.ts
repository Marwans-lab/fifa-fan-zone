import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';
import { readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-quiz-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Quiz"
      description="Placeholder route while Angular quiz migration is in progress."
      path="/quiz"
      [entries]="[{ label: 'quizId', value: quizId }]"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizPageComponent {
  readonly quizId: string;

  constructor(route: ActivatedRoute) {
    this.quizId = readQuizId(route);
  }
}
