import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="angular-shell">
      <h1>Angular migration scaffold</h1>
      <p>Angular now builds alongside the existing React application.</p>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
