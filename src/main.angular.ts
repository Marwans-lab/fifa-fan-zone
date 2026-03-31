import { bootstrapApplication } from '@angular/platform-browser'
import { APP_BASE_HREF } from '@angular/common'
import { provideRouter } from '@angular/router'
import { AppComponent } from './app/app.component'
import { appRoutes } from './app/app.routes'
import { ensureAppReady } from './lib/app-init'
import './styles/tokens.css'
import './styles/global.css'

ensureAppReady()
  .then(() =>
    bootstrapApplication(AppComponent, {
      providers: [provideRouter(appRoutes), { provide: APP_BASE_HREF, useValue: '/fifa-fan-zone/' }],
    }),
  )
  .catch((error: unknown) => {
    console.error('Angular bootstrap failed:', error)
  })
