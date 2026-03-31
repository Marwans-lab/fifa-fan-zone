import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RoutePlaceholderComponent,
  RoutePlaceholderEntry,
} from '../components/route-placeholder.component';
import { readFlowId, readQuizId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-card-match-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Card match"
      description="Card match placeholder for the Angular migration phase."
      path="/card-match"
      [entries]="entries"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMatchPageComponent {
  readonly entries: ReadonlyArray<RoutePlaceholderEntry>;

  constructor(route: ActivatedRoute) {
    this.entries = [
      { label: 'quizId', value: readQuizId(route) },
      { label: 'flowId', value: readFlowId() },
    ];
  }
}
