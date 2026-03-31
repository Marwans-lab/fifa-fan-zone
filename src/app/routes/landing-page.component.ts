import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoutePlaceholderComponent } from '../components/route-placeholder.component';

@Component({
  selector: 'ffz-landing-page',
  standalone: true,
  imports: [RoutePlaceholderComponent],
  template: `
    <ffz-route-placeholder
      title="Landing page"
      description="Public route placeholder for the Angular migration scaffold."
      path="/"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {}
