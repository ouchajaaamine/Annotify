import {CanActivateFn, Router} from "@angular/router";
import {inject} from "@angular/core";
import jwt_decode from "jwt-decode";

export const roleGuard = (expectedRole: string): CanActivateFn => {
  return (route, state) => {
    const router = inject(Router);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwt_decode(token);
        if (decoded.role === expectedRole) {
          return true;
        }
      } catch (e) {
        // Token invalide
      }
    }
    router.navigate(['/login']);
    return false;
  };
};
