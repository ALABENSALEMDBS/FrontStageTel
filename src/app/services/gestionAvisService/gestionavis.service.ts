import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Avis } from '../../../core/models/Avis';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GestionavisService {

  private baseUrl = 'http://localhost:8089/BackStageTel/avis';

  constructor(private http: HttpClient) {}

  // Ajouter un avis
  addAvis(avis: Avis): Observable<Avis> {
    return this.http.post<Avis>(`${this.baseUrl}/add`, avis);
  }

  // Récupérer tous les avis
  getAllAvis(): Observable<Avis[]> {
    return this.http.get<Avis[]>(`${this.baseUrl}/all`);
  }

}
