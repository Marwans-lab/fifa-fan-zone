import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';

@Component({
  selector: 'ffz-identity-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Identity"
      description="Standalone Angular placeholder for the identity flow."
      path="/identity"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentityPageComponent {}
