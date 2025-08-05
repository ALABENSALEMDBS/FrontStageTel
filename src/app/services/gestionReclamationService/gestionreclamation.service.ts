import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserStateService } from '../user-state.service';
import { Reclamation } from '../../../core/models/Reclamation';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionreclamationService {


  private baseUrl = 'http://localhost:8089/BackStageTel/reclamation';

  constructor(private http:HttpClient, private router:Router, private userStateService: UserStateService) { }


  ajouterReclamation(reclamation: Reclamation, idUser: number): Observable<Reclamation> {
    return this.http.post<Reclamation>(`${this.baseUrl}/ajouter/${idUser}`, reclamation);
  }

  getReclamation(idUser: number): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.baseUrl}/getReclByUser/${idUser}`);
  }

   deleteReclamation(id: number): Observable<string> {
    return this.http.delete<string>(`${this.baseUrl}/delete/${id}`, { responseType: 'text' as 'json' });
  }



  getAllReclamations(): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.baseUrl}/getReclamations`);
  }

  // ✅ Mettre une réclamation en cours
  mettreEnCours(idReclamation: number): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.baseUrl}/en-cours/${idReclamation}`, {});
  }

  // ✅ Mettre une réclamation en cours
  mettreRejetee(idReclamation: number): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.baseUrl}/rejetee/${idReclamation}`, {});
  }

  // ✅ Répondre à une réclamation
  repondreReclamation(idReclamation: number, reclamation: Reclamation): Observable<Reclamation> {
    return this.http.put<Reclamation>(`${this.baseUrl}/repondre/${idReclamation}`, reclamation);
  }


  modifierReclamation(id: number, reclamation: Reclamation): Observable<any> {
    return this.http.put(`${this.baseUrl}/modifierRecl/${id}`, reclamation);
  }


   getReclamationsByUserAndNumero(email: string, numeroConcerne: number): Observable<Reclamation[]> {
    return this.http.get<Reclamation[]>(`${this.baseUrl}/by-user/${email}/${numeroConcerne}`);
  }
}
