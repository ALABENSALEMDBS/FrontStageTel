import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ForgotPasswordRequest } from '../../../core/models/ForgotPasswordRequest';
import { LoginRequest } from '../../../core/models/LoginRequest';
import { LoginResponse } from '../../../core/models/LoginResponse';
import { ResetPasswordRequest } from '../../../core/models/ResetPasswordRequest';
import { UserRegistrationRequest } from '../../../core/models/UserRegistrationRequest';
import { Utilisateur } from '../../../core/models/Utilisateur';
import { UserStateService } from '../user-state.service';

@Injectable({
  providedIn: 'root'
})
export class GestionuserService {

  private baseUrl = 'http://localhost:8089/BackStageTel/user';

  constructor(private http:HttpClient, private router:Router, private userStateService: UserStateService) { }

  /**
   * Inscription d'un nouvel utilisateur
   * @param registrationRequest - Les données d'inscription de l'utilisateur
   * @returns Observable<Utilisateur> - L'utilisateur créé
   */
  registerUser(registrationRequest: UserRegistrationRequest): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(`${this.baseUrl}/auth/register`, registrationRequest);
  }

   uploadFile(file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);  // 'file' must match @RequestParam name on backend
    return this.http.post(`${this.baseUrl}/upload`, formData); //, { headers });
  }

  /**
   * Crée un objet UserRegistrationRequest à partir des données du formulaire
   * @param formData - Les données du formulaire d'inscription
   * @returns UserRegistrationRequest - L'objet formaté pour l'API
   */
  createRegistrationRequest(formData: any): UserRegistrationRequest {
    const request = new UserRegistrationRequest();
    request.nomUser = formData.nomUser;
    request.prenomUser = formData.prenomUser;
    request.emailUser = formData.emailUser;
    request.passwordUser = formData.passwordUser;
    request.numeroLigne = parseInt(formData.numeroLigne);
    request.documentContrat = formData.documentContrat;
    request.photoUser = formData.photoUser || '';
    
    return request;
  }

  /**
   * Demande de réinitialisation de mot de passe
   * @param email - L'email de l'utilisateur
   * @returns Observable<string> - Message de confirmation
   */
  sendResetCode(email: string): Observable<string> {
    const request: ForgotPasswordRequest = { email };
    return this.http.post(`${this.baseUrl}/forgot-password`, request, { responseType: 'text' });
  }

  /**
   * Réinitialisation du mot de passe avec code de vérification
   * @param email - L'email de l'utilisateur
   * @param code - Le code de vérification
   * @param newPassword - Le nouveau mot de passe
   * @returns Observable<string> - Message de confirmation
   */
  resetPassword(email: string, code: string, newPassword: string): Observable<string> {
    const request: ResetPasswordRequest = { email, code, newPassword };
    return this.http.post(`${this.baseUrl}/reset-password`, request, { responseType: 'text' });
  }




  login(credentials: LoginRequest): Observable<LoginResponse> {
      return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, credentials);
    }


    logout(): void {
      localStorage.removeItem("token")
      this.userStateService.clearCurrentUser()
      console.log("Token removed from localStorage")
      this.router.navigate(['/login']);
    }

    isAuthenticated(): boolean {
        const token = localStorage.getItem("token")
        console.log("Checking authentication. Token in localStorage:", token)
      return !!token
    }

    /**
     * Sauvegarde les informations de session après connexion
     * @param loginResponse - La réponse de connexion du backend
     */
    saveUserSession(loginResponse: LoginResponse): void {
      localStorage.setItem("token", loginResponse.token);
      const userData = {
        idUser: loginResponse.id,
        nomUser: loginResponse.nom,
        prenomUser: loginResponse.prenom,
        emailUser: loginResponse.email,
        numeroLigne: loginResponse.numeroLigne,
        documentContrat: loginResponse.documentContrat,
        // role: loginResponse.role,
        photoUser: loginResponse.photoUser,
        etatCompte: loginResponse.etatCompte
      };
      this.userStateService.setCurrentUser(userData);
    }

    /**
     * Récupère les informations de l'utilisateur connecté
     * @returns Les données de l'utilisateur ou null
     */
    getCurrentUser(): any {
      return this.userStateService.getCurrentUser();
    }

}
