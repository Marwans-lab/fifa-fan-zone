import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RoutePlaceholderComponent,
  RoutePlaceholderEntry,
} from '../components/route-placeholder.component';
import { readTeamId } from '../lib/navigation-state';

@Component({
  selector: 'ffz-picture-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Picture"
      description="Placeholder for the Picture route."
      path="/picture"
      [entries]="entries"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicturePageComponent {
  readonly entries: ReadonlyArray<RoutePlaceholderEntry>;

  constructor(route: ActivatedRoute) {
    this.entries = [{ label: 'teamId', value: readTeamId(route) }];
  }
}
