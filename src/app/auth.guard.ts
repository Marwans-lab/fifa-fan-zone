import { CanActivateFn } from '@angular/router'
import { ensureAuth } from '../lib/ensureAuth'

export const authGuard: CanActivateFn = async () => {
  try {
    await ensureAuth()
    return true
  } catch {
    return false
  }
}
