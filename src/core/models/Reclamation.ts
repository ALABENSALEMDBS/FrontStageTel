export enum TypeRecl {
    Mon_compte_MY_TT = 'Mon_compte_MY_TT',
    Mon_Mobile = 'Mon_Mobile',
    Internet_Mobile = 'Internet_Mobile',
    Mon_Fixe = 'Mon_Fixe',
    Service_e_Facture = 'Service_e_Facture'
}

export enum EtatRecl {
    NOUVELLE = 'NOUVELLE',
    EN_COURS = 'EN_COURS',
    ASSIGNEE = 'ASSIGNEE',
    RESOLUE = 'RESOLUE',
    FERMEE = 'FERMEE',
    REJETEE = 'REJETEE',
    EN_ATTENTE_CLIENT = 'EN_ATTENTE_CLIENT'
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
}