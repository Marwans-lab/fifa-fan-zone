import { HashLocationStrategy, LocationStrategy } from '@angular/common'
import { ApplicationConfig } from '@angular/core'
import { provideRouter, withViewTransitions } from '@angular/router'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
  ],
}
