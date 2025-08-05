import { Injectable } from '@angular/core';
import { Renseignement } from '../../../core/models/Renseignement';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionRenseignementService {

  private baseUrl = 'http://localhost:8089/BackStageTel/renseignement';

  constructor(private http: HttpClient) { }

  ajouterRenseignement(renseignement: Renseignement, idUser: number): Observable<Renseignement> {
    return this.http.post<Renseignement>(`${this.baseUrl}/ajouter/${idUser}`, renseignement);
  }


  getAllRenseignements(): Observable<Renseignement[]> {
    return this.http.get<Renseignement[]>(`${this.baseUrl}/listeRens`);
  }


  repondreRenseignement(idRenseignement: number, renseignement: Renseignement): Observable<Renseignement> {
  return this.http.put<Renseignement>(`${this.baseUrl}/repondre/${idRenseignement}`, renseignement);
  }

  getRenseignementByUser(idUser: number): Observable<Renseignement[]> {
  return this.http.get<Renseignement[]>(`${this.baseUrl}/getbyuser/${idUser}`);
  }

}
