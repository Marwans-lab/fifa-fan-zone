import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { ensureAuth } from '../../lib/ensureAuth'

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router)

  try {
    await ensureAuth()
    return true
  } catch {
    return router.createUrlTree(['/'])
  }
}
