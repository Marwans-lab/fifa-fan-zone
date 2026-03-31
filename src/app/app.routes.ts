import { Routes } from '@angular/router'
import { HomeComponent } from './home.component'
import { authGuard } from './guards/auth.guard'

export const appRoutes: Routes = [{ path: '', component: HomeComponent, canActivate: [authGuard] }]
