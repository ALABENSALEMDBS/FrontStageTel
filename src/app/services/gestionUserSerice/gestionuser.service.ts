import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRegistrationRequest } from '../../../core/models/UserRegistrationRequest';
import { Utilisateur } from '../../../core/models/Utilisateur';

@Injectable({
  providedIn: 'root'
})
export class GestionuserService {

  private baseUrl = 'http://localhost:8089/BackStageTel/user';

  constructor(private http:HttpClient) { }

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

}
