import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ffz-home',
  standalone: true,
  template: `
    <section class="shell glass page-in">
      <h1 class="title">FIFA fan zone</h1>
      <p class="body">
        Angular scaffold is ready. React pages remain in place for incremental migration.
      </p>
    </section>
  `,
  styles: [
    `
      .shell {
        min-height: 100svh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--sp-3);
        padding: var(--sp-6);
        color: var(--c-text-1);
        box-sizing: border-box;
      }

      .title {
        margin: 0;
        font-family: var(--font-display);
        font-size: var(--text-2xl);
        font-weight: var(--weight-bold);
        line-height: var(--leading-snug);
        letter-spacing: var(--tracking-snug);
        text-transform: none;
      }

      .body {
        margin: 0;
        font-family: var(--font-body);
        font-size: var(--text-md);
        font-weight: var(--weight-reg);
        line-height: var(--leading-body);
        color: var(--c-text-2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
