import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';

@Component({
  selector: 'ffz-team-selection-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Team selection"
      description="Protected placeholder for choosing a team before picture capture."
      path="/team-selection"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSelectionPageComponent {}
