import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';

@Component({
  selector: 'ffz-card-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Card"
      description="Angular lazy route placeholder for the fan card page."
      path="/card"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardPageComponent {}
