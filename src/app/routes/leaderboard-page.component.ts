import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';

@Component({
  selector: 'ffz-leaderboard-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Leaderboard page"
      description="Leaderboard UI will be migrated in a follow-up issue."
      path="/leaderboard"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaderboardPageComponent {}
