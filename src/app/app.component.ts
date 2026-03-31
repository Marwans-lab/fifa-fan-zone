import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { AuthService } from './services/auth.service'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(authService: AuthService) {
    // Kick off auth bootstrap immediately; guard also enforces per-route access.
    void authService.ensureAuth()
  }
}
