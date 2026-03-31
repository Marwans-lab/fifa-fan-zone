import { Component } from '@angular/core'

@Component({
  selector: 'app-card-page',
  standalone: true,
  template: `
    <main class="page-in" data-route="card" style="min-height: 100dvh; padding: var(--sp-6);">
      <h1 style="font: var(--f-brand-type-title-3); color: var(--c-text-1);">Card</h1>
      <p style="font: var(--f-brand-type-body); color: var(--c-text-2);">Placeholder page for Angular migration.</p>
    </main>
  `,
})
export class CardPage {}
