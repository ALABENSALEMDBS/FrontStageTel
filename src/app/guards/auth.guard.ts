import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GestionuserService } from '../services/gestionUserSerice/gestionuser.service';

export const authGuard: CanActivateFn = (route, state) => {
  const gestionUserService = inject(GestionuserService);
  const router = inject(Router);

  if (gestionUserService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
