import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';
import { readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-image-quiz-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Image quiz"
      description="Lazy-loaded Angular placeholder for the image quiz route."
      path="/image-quiz"
      [entries]="[
        { label: 'quizId (param/state)', value: quizId }
      ]"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageQuizPageComponent {
  readonly quizId: string;

  constructor(route: ActivatedRoute) {
    this.quizId = readQuizId(route);
  }
}
