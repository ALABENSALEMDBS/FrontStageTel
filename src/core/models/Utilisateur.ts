import { Avis } from "./Avis";
import { Reclamation } from "./Reclamation";
import { Renseignement } from "./Renseignement";
import { Role } from "./Role";

export enum EtatCompte {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU'
}

export class Utilisateur{
    idUser!: number;
    nomUser!: string;
    prenomUser!: string;
    photoUser!: string;
    emailUser!: string;
    passwordUser!: string;
    createdAt!: Date;
    numeroLigne!: number;
    documentContrat!: string;
    etatCompte!: EtatCompte;

    Avis?: Avis[];
    renseignements?: Renseignement[];
    reclamations?: Reclamation[];
    role?: Role;

    }