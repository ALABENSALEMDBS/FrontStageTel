  export enum EtatCompte {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU'
}
  export interface LoginResponse {
    token: string;
    role: string;
    id: number;
    nom: string;
    prenom: string;
    email: string;
    photoUser: string;
    documentContrat: string;
    createdAt: Date;
    numeroLigne: number;
    etatCompte: EtatCompte;
  }