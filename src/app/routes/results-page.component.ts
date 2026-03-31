import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';
import { readResultsValues } from '../lib/navigation-state';

@Component({
  selector: 'ffz-results-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Results"
      description="Lazy-loaded placeholder for the results page."
      path="/results"
      [entries]="[
        { label: 'score', value: results.score },
        { label: 'total', value: results.total },
        { label: 'quizTitle', value: results.quizTitle },
      ]"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsPageComponent {
  readonly results = readResultsValues();
}
