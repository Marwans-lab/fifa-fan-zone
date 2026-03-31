import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'

@Component({
  selector: 'app-screen',
  standalone: true,
  imports: [NgClass, NgStyle],
  templateUrl: './screen.component.html',
  styleUrls: ['./screen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScreenComponent {
  @Input() centered = false
  @Input() className = ''
  @Input() style: Record<string, string | number | null | undefined> | null = null

  get classes(): string[] {
    return ['f-screen', this.centered ? 'f-screen--centered' : '', this.className]
      .filter((value) => value.length > 0)
  }

  get styles(): Record<string, string | number | null | undefined> {
    return this.style ?? {}
  }
}
