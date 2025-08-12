import { Avis } from "./Avis";
import { Utilisateur } from "./Utilisateur";

export enum TypeRecl {
    Mon_compte_MY_TT = 'Mon_compte_MY_TT',
    Mon_Mobile = 'Mon_Mobile',
    Internet_Mobile = 'Internet_Mobile',
    Mon_Fixe = 'Mon_Fixe',
    Service_e_Facture = 'Service_e_Facture'
}

export enum EtatRecl {
    EN_COURS = 'EN_COURS',
    TRAITEE = 'TRAITEE',
    REJETEE = 'REJETEE',
    EN_ATTENTE = 'EN_ATTENTE'
}

export class Reclamation{
    idRecl!: number;
    typeRecl!: TypeRecl;
    descriptionRecl!: string;
    captureRecl!: string;
    documentRecl!:string;
    etatRecl!: EtatRecl;
    dateRecl!: Date;
    descriptionReponRecl!: string;
    dateReponRecl!: Date
    utilisateurRecl!: Utilisateur;

    numeroConcerne!: number;
    sujetRecl!: string;
    avisRecl!: Avis;
}