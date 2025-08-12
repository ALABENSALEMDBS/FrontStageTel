import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import jsPDF from 'jspdf';
import { Avis } from '../../../core/models/Avis';
import { ChangePasswordRequest } from '../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../core/models/ChangePhoto';
import { Reclamation, TypeRecl } from '../../../core/models/Reclamation';
import { Renseignement } from '../../../core/models/Renseignement';
import { GestionavisService } from '../../services/gestionAvisService/gestionavis.service';
import { GestionreclamationService } from '../../services/gestionReclamationService/gestionreclamation.service';
import { GestionRenseignementService } from '../../services/gestionRenseignementService/gestion-renseignement.service';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../services/notification.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-clientdashboard',
  imports: [NgFor, NgIf, ReactiveFormsModule, FormsModule],
  templateUrl: './clientdashboard.component.html',
  styleUrl: './clientdashboard.component.css'
})
export class ClientdashboardComponent  implements OnInit, OnDestroy {
  isDropdownOpen = false
  currentUser: any = null
  userNameFromUrl: string | null = null
  
  // Variables pour le modal de changement de mot de passe
  isChangePasswordModalOpen = false
  changePasswordForm: FormGroup
  showOldPassword = false
  showNewPassword = false
  showConfirmPassword = false
  isChangingPassword = false

  // Variables pour le modal d'informations utilisateur
  isUserInfoModalOpen = false

  // Variables pour la mise à jour de la photo
  isUpdatingPhoto = false

  // Variables pour le modal de réclamation
  isReclamationModalOpen = false
  reclamationForm: FormGroup
  isSubmittingReclamation = false
  isUploadingCapture = false
  isUploadingDocument = false
  selectedCaptureFile: File | null = null
  selectedDocumentFile: File | null = null
  captureRecl: string = ''
  documentRecl: string = ''
  
  // Variables pour les prévisualisations
  capturePreviewUrl: string | null = null
  documentPreviewUrl: string | null = null

  // Variables pour la modal photo
  isPhotoModalOpen = false

  // Variables pour le modal de liste des réclamations
  isReclamationsListModalOpen = false
  reclamationsList: any[] = []
  filteredReclamationsList: any[] = []
  isLoadingReclamations = false
  
  // Variables pour la confirmation de suppression
  isDeleteConfirmationOpen = false
  reclamationToDelete: any = null
  isDeletingReclamation = false
  
  // Variables pour la modification de réclamations
  isEditReclamationModalOpen = false
  isEditingReclamation = false
  reclamationToEdit: any = null
  editReclamationForm: FormGroup
  editSelectedCaptureFile: File | null = null
  editSelectedDocumentFile: File | null = null
  editCapturePreviewUrl: string | null = null
  editDocumentPreviewUrl: string | null = null
  isUploadingEditCapture = false
  isUploadingEditDocument = false
  
  // Variables pour les filtres
  filterTypeRecl = ''
  filterEtatRecl = ''
  filterIdRecl = ''
  
  // Options pour les filtres
  typeReclOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'Mon_compte_MY_TT', label: 'Mon compte MY TT' },
    { value: 'Mon_Mobile', label: 'Mon Mobile' },
    { value: 'Internet_Mobile', label: 'Internet Mobile' },
    { value: 'Mon_Fixe', label: 'Mon Fixe' },
    { value: 'Service_e_Facture', label: 'Service e-Facture' }
  ]
  
  etatReclOptions = [
    { value: '', label: 'Tous les états' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TRAITEE', label: 'Résolu' },
    { value: 'REJETEE', label: 'Fermé' }
  ]

  // Options pour les sujets de réclamation selon le type
  sujetReclOptions: { [key: string]: string[] } = {
    'Mon_compte_MY_TT': [
      'Paiement Factures',
      'Achat Forfait',
      'Transfert Solde'
    ],
    'Mon_Mobile': [
      'jeux & Applications Mobile',
      'Appels et SMS',
      'Roaming'
    ],
    'Internet_Mobile': [
      'Forfait',
      'Connexion Mobile Wifi',
      'Connexion Mobile'
    ],
    'Mon_Fixe': [
      'Retard Nouvelle Installation',
      'Recharge',
      'Fibre optique'
    ],
    'Service_e_Facture': [
      'Corriger mon adresse Email',
      'Désactiver le service e-Facture'
    ]
  }

  // Options actuelles pour le dropdown sujet
  currentSujetReclOptions: string[] = []

  // Variables pour le modal de renseignement
  isRenseignementModalOpen = false
  renseignementForm: FormGroup
  isSubmittingRenseignement = false

  // Variables pour le modal de liste des renseignements
  isRenseignementsListModalOpen = false
  renseignementsList: any[] = []
  filteredRenseignementsList: any[] = []
  isLoadingRenseignements = false

  // Variables pour les filtres des renseignements
  filterIdRens = ''
  filterSujetRens = ''

  // Options pour les sujets de renseignement
  sujetRenseignementOptions: string[] = [
    'Identité Numérique e-Houwiya',
    'Internet Mobile',
    'Fixe',
    'Mobile',
    'Application MY TT',
    'Linkedin',
    'Youtube',
    'Twitter X',
    'FB/Messenger',
    'Portail'
  ]

  // Variables pour le modal d'avis
  isAvisModalOpen = false
  avisForm: FormGroup
  isSubmittingAvis = false
  currentReclamationForAvis: any = null

  services = [
    {
      icon: "📱",
      title: "Mobile",
      description: "Forfaits mobiles avec internet illimité",
      features: ["Appels illimités", "SMS illimités", "Internet 4G/5G", "Roaming international"]
    },
    {
      icon: "🌐",
      title: "Internet Fixe",
      description: "Connexion haut débit pour votre domicile",
      features: ["Fibre optique", "Débit jusqu'à 1Gb/s", "Wi-Fi gratuit", "Support technique 24/7"]
    },
    {
      icon: "📺",
      title: "IPTV",
      description: "Télévision numérique avec plus de 200 chaînes",
      features: ["Chaînes HD", "Replay 7 jours", "Enregistrement", "Multi-écrans"]
    },
    {
      icon: "🏢",
      title: "Solutions Entreprises",
      description: "Services professionnels sur mesure",
      features: ["Lignes dédiées", "Cloud computing", "Sécurité avancée", "Support prioritaire"]
    }
  ]

  news = [
    {
      title: "Nouvelle offre 5G disponible",
      date: "15 Janvier 2024",
      content: "Découvrez nos nouveaux forfaits 5G avec des débits ultra-rapides."
    },
    {
      title: "Extension du réseau fibre",
      date: "10 Janvier 2024", 
      content: "Le réseau fibre optique s'étend dans 50 nouvelles zones."
    },
    {
      title: "Application mobile mise à jour",
      date: "5 Janvier 2024",
      content: "Nouvelle version de l'app avec de nombreuses améliorations."
    }
  ]

  constructor(private router: Router, private route: ActivatedRoute, private fb: FormBuilder, private gestionUserService: GestionuserService, private gestionReclamationService: GestionreclamationService, private gestionRenseignementService: GestionRenseignementService, private userStateService: UserStateService, private notificationService: NotificationService, private gestionAvisService: GestionavisService) {
    // Initialiser le formulaire de changement de mot de passe
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Initialiser le formulaire de réclamation
    this.reclamationForm = this.fb.group({
      typeRecl: ['', [Validators.required]],
      sujetRecl: ['', [Validators.required]],
      numeroConcerne: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      descriptionRecl: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    // Initialiser le formulaire d'édition de réclamation
    this.editReclamationForm = this.fb.group({
      typeRecl: ['', [Validators.required]],
      sujetRecl: ['', [Validators.required]],
      numeroConcerne: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      descriptionRecl: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    // Initialiser le formulaire de renseignement
    this.renseignementForm = this.fb.group({
      sujetRens: ['', [Validators.required]],
      descriptionRens: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    // Initialiser le formulaire d'avis
    this.avisForm = this.fb.group({
      note: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      commentaire: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  ngOnInit(): void {
    // Récupérer le paramètre userName de l'URL
    this.userNameFromUrl = this.route.snapshot.params['userName'];
    console.log("🔗 Nom d'utilisateur depuis URL:", this.userNameFromUrl);
    
    // Récupérer les données de l'utilisateur connecté
    this.currentUser = this.gestionUserService.getCurrentUser();
    
    // S'abonner aux changements d'état de l'utilisateur
    this.userStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
      // Charger les réclamations et renseignements lorsque l'utilisateur est disponible
      if (user && user.idUser) {
        this.loadReclamationsCount();
        this.loadRenseignementsCount();
      }
    });
    
    // Vérifier si l'utilisateur est connecté
    if (!this.gestionUserService.isAuthenticated() || !this.currentUser) {
      this.router.navigate(['/login']);
    } else if (this.currentUser && this.currentUser.idUser) {
      // Charger le nombre de réclamations et renseignements immédiatement si l'utilisateur est déjà disponible
      this.loadReclamationsCount();
      this.loadRenseignementsCount();
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement
    if (!target.closest('.user-menu')) {
      this.isDropdownOpen = false
    }
  }

  navigateToAccount() {
    this.isDropdownOpen = false
    this.isUserInfoModalOpen = true
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden'
    console.log("Opening user info modal")
  }

  logout() {
    this.isDropdownOpen = false
    // this.router.navigate(["/login"])
    this.gestionUserService.logout()
    console.log("User logged out")
  }

  openReclamation() {
    console.log("Open reclamation")
    // Implement reclamation functionality
  }

  openRenseignement() {
    this.isRenseignementModalOpen = true;
    // Réinitialiser le formulaire avec des valeurs vides
    this.renseignementForm.reset({
      sujetRens: '',
      descriptionRens: ''
    });
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("💬 Modal renseignement ouvert");
  }

  closeRenseignementModal() {
    this.isRenseignementModalOpen = false;
    // Réinitialiser le formulaire
    this.renseignementForm.reset({
      sujetRens: '',
      descriptionRens: ''
    });
    this.isSubmittingRenseignement = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("❌ Modal renseignement fermé");
  }

  submitRenseignement() {
    if (this.renseignementForm.valid && !this.isSubmittingRenseignement) {
      this.isSubmittingRenseignement = true;
      
      // Créer l'objet renseignement
      const renseignement = new Renseignement();
      renseignement.sujetRens = this.renseignementForm.get('sujetRens')?.value;
      renseignement.descriptionRens = this.renseignementForm.get('descriptionRens')?.value;
      
      console.log('💬 Soumission du renseignement:', renseignement);
      
      this.gestionRenseignementService.ajouterRenseignement(renseignement, this.currentUser.idUser).subscribe({
        next: (response) => {
          console.log('✅ Renseignement soumis avec succès:', response);
          this.isSubmittingRenseignement = false;
          
          // Fermer le modal après soumission
          this.closeRenseignementModal();
          
          // Mettre à jour le nombre de renseignements
          this.loadRenseignementsCount();
          
          // Afficher une notification de succès
          this.notificationService.showSuccess('Renseignement soumis avec succès !', 4000);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la soumission du renseignement:', error);
          this.isSubmittingRenseignement = false;
          
          let errorMessage = 'Une erreur s\'est produite lors de la soumission du renseignement.';
          if (error.status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          } else if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions pour créer un renseignement.';
          }
          
          this.notificationService.showError(errorMessage, 5000);
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.renseignementForm.controls).forEach(key => {
        this.renseignementForm.get(key)?.markAsTouched();
      });
      this.notificationService.showError('Veuillez remplir tous les champs obligatoires', 3000);
    }
  }

  // ========== MÉTHODES POUR LA LISTE DES RENSEIGNEMENTS ==========

  openRenseignementsListModal() {
    this.isRenseignementsListModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.loadRenseignements();
    console.log("💬 Modal liste des renseignements ouvert");
  }

  closeRenseignementsListModal() {
    this.isRenseignementsListModalOpen = false;
    document.body.style.overflow = 'auto';
    // Réinitialiser les filtres
    this.filterIdRens = '';
    this.filterSujetRens = '';
    console.log("❌ Modal liste des renseignements fermé");
  }

  loadRenseignements() {
    if (!this.currentUser?.idUser) {
      this.notificationService.showError('Utilisateur non identifié', 3000);
      return;
    }

    this.isLoadingRenseignements = true;
    console.log("💬 Chargement des renseignements pour l'utilisateur:", this.currentUser.idUser);

    this.gestionRenseignementService.getRenseignementByUser(this.currentUser.idUser).subscribe({
      next: (response: any) => {
        console.log("✅ Renseignements chargés:", response);
        this.renseignementsList = response || [];
        this.applyRenseignementFilters();
        this.isLoadingRenseignements = false;
      },
      error: (error: any) => {
        console.error("❌ Erreur lors du chargement des renseignements:", error);
        this.isLoadingRenseignements = false;
        this.renseignementsList = [];
        this.filteredRenseignementsList = [];
        
        let errorMessage = 'Erreur lors du chargement des renseignements';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 404) {
          errorMessage = 'Aucun renseignement trouvé';
        }
        
        this.notificationService.showError(errorMessage, 4000);
      }
    });
  }

  applyRenseignementFilters() {
    this.filteredRenseignementsList = this.renseignementsList.filter(renseignement => {
      const matchId = !this.filterIdRens || 
        (renseignement.idRens && renseignement.idRens.toString().includes(this.filterIdRens));
      const matchSujet = !this.filterSujetRens || 
        (renseignement.sujetRens && renseignement.sujetRens.toLowerCase().includes(this.filterSujetRens.toLowerCase()));
      
      return matchId && matchSujet;
    });
    
    console.log("🔍 Filtres renseignements appliqués:", {
      total: this.renseignementsList.length,
      filtered: this.filteredRenseignementsList.length,
      filters: {
        id: this.filterIdRens,
        sujet: this.filterSujetRens
      }
    });
  }

  onRenseignementFilterChange() {
    this.applyRenseignementFilters();
  }

  clearRenseignementFilters() {
    this.filterIdRens = '';
    this.filterSujetRens = '';
    this.applyRenseignementFilters();
  }

  formatRenseignementDate(dateString: string): string {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Gestion d'erreur d'image pour avatar par défaut
  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2Yzc1N2QiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM3MyIDQgNC41IDcuNVM5LjUgMTIgMTIgMTJaTTEyIDEzLjVjLTMgMC04IDEuNS04IDQuNXYyaDEydi0yYzAtM3M1LTQuNS04LTQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
  }

  // Méthodes pour la gestion des documents
  isImageFile(type: string): boolean {
    if (!type) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    return imageTypes.includes(type.toLowerCase());
  }

  isPdfFile(type: string): boolean {
    if (!type) return false;
    return type.toLowerCase() === 'application/pdf';
  }

  getFileName(url: string): string {
    if (!url) return 'Document';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Document';
  }

  onDocumentError(event: any) {
    console.error('Erreur lors du chargement du document:', event);
    // Masquer l'image en cas d'erreur
    event.target.style.display = 'none';
  }

  openDocumentViewer(url: string, type: 'image' | 'pdf') {
    if (!url) return;
    
    console.log(`Ouverture du document ${type}:`, url);
    
    if (type === 'pdf') {
      // Ouvrir le PDF dans un nouvel onglet
      window.open(url, '_blank');
    } else if (type === 'image') {
      // Créer un modal pour afficher l'image en grand
      this.showImageModal(url);
    }
  }

  showImageModal(imageUrl: string) {
    // Créer un modal simple pour afficher l'image
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Fermer le modal en cliquant dessus
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.style.overflow = 'auto';
    });
  }

  // Méthodes pour le modal de changement de mot de passe
  openChangePasswordModal() {
    this.isChangePasswordModalOpen = true;
    this.changePasswordForm.reset();
    // Fermer le dropdown si ouvert
    this.isDropdownOpen = false;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
  }

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
    this.changePasswordForm.reset();
    this.showOldPassword = false;
    this.showNewPassword = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
  }

  // Méthodes pour le modal d'informations utilisateur
  closeUserInfoModal() {
    this.isUserInfoModalOpen = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
  }

  toggleOldPasswordVisibility() {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onChangePassword() {
    if (this.changePasswordForm.valid && !this.isChangingPassword) {
      this.isChangingPassword = true;
      
      const changePasswordRequest: ChangePasswordRequest = {
        oldPassword: this.changePasswordForm.get('oldPassword')?.value,
        newPassword: this.changePasswordForm.get('newPassword')?.value
      };

      console.log("🔐 Changement de mot de passe en cours...");
      
      this.gestionUserService.changePassword(changePasswordRequest).subscribe({
        next: (response) => {
          console.log("✅ Mot de passe changé avec succès:", response);
          this.isChangingPassword = false;
          
          // Afficher une notification de succès
          this.notificationService.showSuccess('Mot de passe changé avec succès !', 4000);
          
          // Fermer le modal
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error("❌ Erreur lors du changement de mot de passe:", error);
          this.isChangingPassword = false;
          
          let errorMessage = 'Une erreur s\'est produite lors du changement de mot de passe.';
          if (error.status === 400) {
            errorMessage = error.error || 'Ancien mot de passe incorrect.';
          } else if (error.status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          }
          
          // Afficher une notification d'erreur
          this.notificationService.showError(errorMessage, 5000);
        }
      });
    }
  }

  ngOnDestroy(): void {
    // S'assurer que le scroll est restauré si le composant est détruit
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen || this.isReclamationModalOpen || this.isReclamationsListModalOpen || this.isDeleteConfirmationOpen || this.isPhotoModalOpen || this.isRenseignementModalOpen || this.isRenseignementsListModalOpen || this.isAvisModalOpen) {
      document.body.style.overflow = 'auto';
    }
  }





  // Méthodes pour la gestion de l'upload de photo de profil
  
  // Méthode pour ouvrir le sélecteur de fichier
  onProfilePhotoClick() {
    if (this.isUpdatingPhoto) return;
    
    console.log("🖼️ Clic sur la photo de profil - Ouverture du sélecteur de fichier");
    
    // Créer un input file temporaire
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.handlePhotoUpload(file);
      }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  // Méthode pour gérer l'upload de la photo
  handlePhotoUpload(file: File) {
    console.log("📸 Fichier sélectionné:", file.name, file.type, file.size);
    
    // Vérifications de base
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('Veuillez sélectionner un fichier image valide.', 5000);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      this.notificationService.showError('La taille de l\'image ne doit pas dépasser 5MB.', 5000);
      return;
    }
    
    this.isUpdatingPhoto = true;
    
    // Upload du fichier d'abord
    this.gestionUserService.uploadFile(file).subscribe({
      next: (uploadResponse) => {
        console.log("✅ Upload réussi:", uploadResponse);
        // Maintenant mettre à jour la photo de l'utilisateur
        const changePhoto: ChangePhoto = {
          role: this.currentUser.role,
          id: this.currentUser.idUser,
          nom: this.currentUser.nomUser,
          prenom: this.currentUser.prenomUser,
          email: this.currentUser.emailUser,
          numeroLigne: this.currentUser.numeroLigne,
          documentContrat: this.currentUser.documentContrat,
          photoUser: uploadResponse.url || uploadResponse.filePath || uploadResponse,
          etatCompte: this.currentUser.etatCompte,
          createdAt: this.currentUser.createdAt
        };
        
        console.log("🔄 Mise à jour de la photo utilisateur:", changePhoto);
        
        this.gestionUserService.updatePhoto(this.currentUser.idUser, changePhoto).subscribe({
          next: (response) => {
            console.log("✅ Photo mise à jour avec succès:", response);
            this.isUpdatingPhoto = false;
            
            // Mettre à jour l'utilisateur local avec la nouvelle photo
            if (this.currentUser) {
              this.currentUser.photoUser = response.photoUser;
              // Mettre à jour aussi le service d'état utilisateur
              this.userStateService.setCurrentUser(this.currentUser);
            }
            
            // Afficher une notification de succès
            this.notificationService.showSuccess('Photo de profil mise à jour avec succès !', 4000);
          },
          error: (error) => {
            console.error("❌ Erreur lors de la mise à jour de la photo:", error);
            this.isUpdatingPhoto = false;
            
            let errorMessage = 'Une erreur s\'est produite lors de la mise à jour de la photo.';
            if (error.status === 403) {
              errorMessage = 'Vous n\'avez pas les permissions pour effectuer cette action.';
            } else if (error.status === 401) {
              errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            }
            
            this.notificationService.showError(errorMessage, 5000);
          }
        });
      },
      error: (error) => {
        console.error("❌ Erreur lors de l'upload:", error);
        this.isUpdatingPhoto = false;
        
        let errorMessage = 'Une erreur s\'est produite lors de l\'upload de l\'image.';
        if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour uploader des fichiers.';
        } else if (error.status === 413) {
          errorMessage = 'Le fichier est trop volumineux.';
        }
        
        this.notificationService.showError(errorMessage, 5000);
      }
    });
  }


  closePhotoModal() {
    this.isPhotoModalOpen = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("Modal photo fermé pour l'agent");
  }

  // Méthodes pour le modal de modification de photo
  openPhotoModal() {
    this.isPhotoModalOpen = true;
    // Fermer le dropdown si ouvert
    this.isDropdownOpen = false;
    // Fermer les autres modals s'ils sont ouverts
    this.isUserInfoModalOpen = false;
    this.isChangePasswordModalOpen = false;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("Modal photo ouvert pour l'agent");
  }

  // uploadError: string | null = null;
  // uploadResponse: any;
  // uploadFile(file: File): Promise<void> {
  //     return new Promise((resolve, reject) => {
  //         this.uploadError = null;
  //         this.gestionUserService.uploadFile(file).subscribe({
  //             next: (response) => {
  //                 console.log('Upload successful:', response);
  //                 resolve();
  //             },
  //             error: (error) => {
  //                 this.uploadError = 'Upload failed: ' + error.message;
  //                 console.error('Upload error:', error);
  //                 reject(error);
  //             }
  //         });
  //     });
  // }

  // Méthodes pour la gestion des fichiers dans le modal réclamation
  onCaptureFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validation du type de fichier (images seulement)
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.showError('Veuillez sélectionner une image (PNG, JPG, JPEG)', 3000);
        event.target.value = '';
        return;
      }
      
      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.notificationService.showError('Le fichier est trop volumineux. Taille maximum: 5MB', 3000);
        event.target.value = '';
        return;
      }
      
      this.selectedCaptureFile = file;
      this.isUploadingCapture = false;
      
      // Générer la prévisualisation
      this.generateImagePreview(file, 'capture');
      
      console.log('📸 Fichier capture sélectionné:', file.name, 'Taille:', this.formatFileSize(file.size));
      this.notificationService.showSuccess(`Image sélectionnée: ${file.name}`, 2000);
    }
  }

  onDocumentFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validation du type de fichier (PDF et images)
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.showError('Veuillez sélectionner un PDF ou une image (PNG, JPG, JPEG)', 3000);
        event.target.value = '';
        return;
      }
      
      // Validation de la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.notificationService.showError('Le fichier est trop volumineux. Taille maximum: 10MB', 3000);
        event.target.value = '';
        return;
      }
      
      this.selectedDocumentFile = file;
      this.isUploadingDocument = false;
      
      // Générer la prévisualisation si c'est une image
      if (this.isImageFile(file.type)) {
        this.generateImagePreview(file, 'document');
      }
      
      console.log('📄 Document sélectionné:', file.name, 'Type:', file.type, 'Taille:', this.formatFileSize(file.size));
      this.notificationService.showSuccess(`Document sélectionné: ${file.name}`, 2000);
    }
  }

  triggerFileUpload(inputId: string) {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Méthodes spécifiques pour les uploads
  triggerCaptureUpload() {
    this.triggerFileUpload('captureFileInput');
  }

  triggerDocumentUpload() {
    this.triggerFileUpload('documentFileInput');
  }

  // Méthodes pour supprimer les fichiers sélectionnés
  removeCaptureFile() {
    this.selectedCaptureFile = null;
    this.isUploadingCapture = false;
    
    // Nettoyer la prévisualisation
    if (this.capturePreviewUrl) {
      URL.revokeObjectURL(this.capturePreviewUrl);
      this.capturePreviewUrl = null;
    }
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('captureFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    console.log('Fichier capture supprimé');
  }

  removeDocumentFile() {
    this.selectedDocumentFile = null;
    this.isUploadingDocument = false;
    
    // Nettoyer la prévisualisation
    if (this.documentPreviewUrl) {
      URL.revokeObjectURL(this.documentPreviewUrl);
      this.documentPreviewUrl = null;
    }
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('documentFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    console.log('Document supprimé');
  }

  // Méthode pour formater la taille des fichiers
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Méthode pour soumettre la réclamation
  submitReclamation() {
    if (this.reclamationForm.valid) {
      this.isSubmittingReclamation = true;
      
      // Créer l'objet réclamation de base
      const reclamation = new Reclamation();
      reclamation.typeRecl = this.reclamationForm.get('typeRecl')?.value as TypeRecl;
      reclamation.sujetRecl = this.reclamationForm.get('sujetRecl')?.value;
      reclamation.numeroConcerne = this.reclamationForm.get('numeroConcerne')?.value;
      reclamation.descriptionRecl = this.reclamationForm.get('descriptionRecl')?.value;
      reclamation.captureRecl = '';
      reclamation.documentRecl = '';

      // Fonction pour finaliser la soumission
      const finalizeSubmission = () => {
        console.log('📋 Soumission de la réclamation:', reclamation);
        
        this.gestionReclamationService.ajouterReclamation(reclamation, this.currentUser.idUser).subscribe({
          next: (response) => {
            console.log('✅ Réclamation soumise avec succès:', response);
            this.isSubmittingReclamation = false;
            
            // Fermer le modal après soumission
            this.closeReclamationModal();
            
            // Mettre à jour le nombre de réclamations
            this.loadReclamationsCount();
            
            // Afficher une notification de succès
            this.notificationService.showSuccess('Réclamation soumise avec succès !', 4000);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la soumission de la réclamation:', error);
            this.isSubmittingReclamation = false;
            
            let errorMessage = 'Une erreur s\'est produite lors de la soumission de la réclamation.';
            if (error.status === 401) {
              errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            } else if (error.status === 403) {
              errorMessage = 'Vous n\'avez pas les permissions pour créer une réclamation.';
            }
            
            this.notificationService.showError(errorMessage, 5000);
          }
        });
      };

      // Gérer l'upload des fichiers
      const uploadPromises: Promise<void>[] = [];

      // Upload de la capture d'écran si présente
      if (this.selectedCaptureFile) {
        const captureUploadPromise = new Promise<void>((resolve, reject) => {
          console.log('📸 Upload de la capture d\'écran en cours...');
          this.gestionUserService.uploadFile(this.selectedCaptureFile!).subscribe({
            next: (uploadResponse) => {
              console.log('✅ Capture d\'écran uploadée:', uploadResponse);
              // Utiliser l'URL retournée par le service
              reclamation.captureRecl = uploadResponse.url || uploadResponse.filePath || uploadResponse;
              resolve();
            },
            error: (error) => {
              console.error('❌ Erreur lors de l\'upload de la capture:', error);
              this.notificationService.showError('Erreur lors de l\'upload de la capture d\'écran', 3000);
              reject(error);
            }
          });
        });
        uploadPromises.push(captureUploadPromise);
      }

      // Upload du document si présent
      if (this.selectedDocumentFile) {
        const documentUploadPromise = new Promise<void>((resolve, reject) => {
          console.log('📄 Upload du document en cours...');
          this.gestionUserService.uploadFile(this.selectedDocumentFile!).subscribe({
            next: (uploadResponse) => {
              console.log('✅ Document uploadé:', uploadResponse);
              // Utiliser l'URL retournée par le service
              reclamation.documentRecl = uploadResponse.url || uploadResponse.filePath || uploadResponse;
              resolve();
            },
            error: (error) => {
              console.error('❌ Erreur lors de l\'upload du document:', error);
              this.notificationService.showError('Erreur lors de l\'upload du document', 3000);
              reject(error);
            }
          });
        });
        uploadPromises.push(documentUploadPromise);
      }

      // Attendre que tous les uploads soient terminés avant de soumettre
      if (uploadPromises.length > 0) {
        Promise.all(uploadPromises)
          .then(() => {
            console.log('✅ Tous les fichiers ont été uploadés avec succès');
            finalizeSubmission();
          })
          .catch((error) => {
            console.error('❌ Erreur lors de l\'upload des fichiers:', error);
            this.isSubmittingReclamation = false;
            this.notificationService.showError('Erreur lors de l\'upload des fichiers. Veuillez réessayer.', 5000);
          });
      } else {
        // Pas de fichiers à uploader, soumettre directement
        finalizeSubmission();
      }
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.reclamationForm.controls).forEach(key => {
        this.reclamationForm.get(key)?.markAsTouched();
      });
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }

  // Méthodes pour gérer le modal réclamation
  openReclamationModal() {
    this.isReclamationModalOpen = true;
    // Réinitialiser le formulaire
      // this.reclamationForm.reset();
    this.reclamationForm.reset({
      typeRecl: '',
      sujetRecl: '',
      numeroConcerne: '',
      descriptionRecl: ''
    });
    

    
    this.selectedCaptureFile = null;
    this.selectedDocumentFile = null;
    this.isUploadingCapture = false;
    this.isUploadingDocument = false;
    // Réinitialiser les options du numéro concerné
    this.currentSujetReclOptions = [];
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("Modal réclamation ouvert");
  }

  // Méthode pour gérer le changement de type de réclamation
  onTypeReclChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedType = target.value;
    
    // Mettre à jour les options du sujet
    this.updateSujetReclOptions(selectedType);
    
    // Réinitialiser le champ sujetRecl
    this.reclamationForm.patchValue({
      sujetRecl: ''
    });
  }

  // Méthode pour gérer le changement de type de réclamation en mode édition
  onEditTypeReclChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedType = target.value;
    
    // Mettre à jour les options du sujet
    this.updateSujetReclOptions(selectedType);
    
    // Réinitialiser le champ sujetRecl
    this.editReclamationForm.patchValue({
      sujetRecl: ''
    });
  }

  // Méthode pour mettre à jour les options du sujet
  updateSujetReclOptions(typeRecl: string) {
    if (typeRecl && this.sujetReclOptions[typeRecl]) {
      this.currentSujetReclOptions = this.sujetReclOptions[typeRecl];
    } else {
      this.currentSujetReclOptions = [];
    }
  }

  // Méthode pour limiter les chiffres dans le champ numeroConcerne
  limitNumeroConcerneDigits(event: any) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Supprimer tous les caractères non numériques
    
    if (value.length > 8) {
      value = value.substring(0, 8); // Limiter à 8 chiffres
    }
    
    input.value = value;
    
    // Mettre à jour le FormControl
    this.reclamationForm.patchValue({
      numeroConcerne: value
    });
  }

  // Méthode pour limiter les chiffres dans le champ numeroConcerne en mode édition
  limitEditNumeroConcerneDigits(event: any) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // Supprimer tous les caractères non numériques
    
    if (value.length > 8) {
      value = value.substring(0, 8); // Limiter à 8 chiffres
    }
    
    input.value = value;
    
    // Mettre à jour le FormControl
    this.editReclamationForm.patchValue({
      numeroConcerne: value
    });
  }

  closeReclamationModal() {
    this.isReclamationModalOpen = false;
    // Réinitialiser le formulaire et les fichiers
    //  this.reclamationForm.reset();
    this.reclamationForm.reset({
      typeRecl: '',
      sujetRecl: '',
      numeroConcerne: '',
      descriptionRecl: ''
    });
    this.selectedCaptureFile = null;
    this.selectedDocumentFile = null;
    this.isUploadingCapture = false;
    this.isUploadingDocument = false;
    
    // Nettoyer les prévisualisations
    if (this.capturePreviewUrl) {
      URL.revokeObjectURL(this.capturePreviewUrl);
      this.capturePreviewUrl = null;
    }
    if (this.documentPreviewUrl) {
      URL.revokeObjectURL(this.documentPreviewUrl);
      this.documentPreviewUrl = null;
    }
    
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("Modal réclamation fermé");
  }

  // Méthodes pour le modal de liste des réclamations
  openReclamationsListModal() {
    this.isReclamationsListModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.loadReclamations();
    console.log("Modal liste des réclamations ouvert");
  }

  closeReclamationsListModal() {
    this.isReclamationsListModalOpen = false;
    document.body.style.overflow = 'auto';
    // Réinitialiser les filtres
    this.filterTypeRecl = '';
    this.filterEtatRecl = '';
    this.filterIdRecl = '';
    console.log("Modal liste des réclamations fermé");
  }

  loadReclamations() {
    if (!this.currentUser?.idUser) {
      this.notificationService.showError('Utilisateur non identifié', 3000);
      return;
    }

    this.isLoadingReclamations = true;
    console.log("📋 Chargement des réclamations pour l'utilisateur:", this.currentUser.idUser);

    this.gestionReclamationService.getReclamation(this.currentUser.idUser).subscribe({
      next: (response: any) => {
        console.log("✅ Réclamations chargées:", response);
        this.reclamationsList = response || [];
        this.applyFilters();
        this.isLoadingReclamations = false;
      },
      error: (error: any) => {
        console.error("❌ Erreur lors du chargement des réclamations:", error);
        this.isLoadingReclamations = false;
        this.reclamationsList = [];
        this.filteredReclamationsList = [];
        
        let errorMessage = 'Erreur lors du chargement des réclamations';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 404) {
          errorMessage = 'Aucune réclamation trouvée';
        }
        
        this.notificationService.showError(errorMessage, 4000);
      }
    });
  }

  // Méthode pour charger seulement le nombre de réclamations (pour l'affichage du dashboard)
  loadReclamationsCount() {
    if (!this.currentUser?.idUser) {
      return;
    }

    console.log("📊 Chargement du nombre de réclamations pour l'utilisateur:", this.currentUser.idUser);

    this.gestionReclamationService.getReclamation(this.currentUser.idUser).subscribe({
      next: (response: any) => {
        console.log("✅ Nombre de réclamations chargé:", response?.length || 0);
        this.reclamationsList = response || [];
      },
      error: (error: any) => {
        console.error("❌ Erreur lors du chargement du nombre de réclamations:", error);
        this.reclamationsList = [];
      }
    });
  }

  // Méthode pour charger seulement le nombre de renseignements (pour l'affichage du dashboard)
  loadRenseignementsCount() {
    if (!this.currentUser?.idUser) {
      return;
    }

    console.log("📊 Chargement du nombre de renseignements pour l'utilisateur:", this.currentUser.idUser);

    this.gestionRenseignementService.getRenseignementByUser(this.currentUser.idUser).subscribe({
      next: (response: any) => {
        console.log("✅ Nombre de renseignements chargé:", response?.length || 0);
        this.renseignementsList = response || [];
      },
      error: (error: any) => {
        console.error("❌ Erreur lors du chargement du nombre de renseignements:", error);
        this.renseignementsList = [];
      }
    });
  }

  applyFilters() {
    this.filteredReclamationsList = this.reclamationsList.filter(reclamation => {
      const matchType = !this.filterTypeRecl || reclamation.typeRecl === this.filterTypeRecl;
      const matchEtat = !this.filterEtatRecl || reclamation.etatRecl === this.filterEtatRecl;
      const matchId = !this.filterIdRecl || reclamation.idRecl.toString().includes(this.filterIdRecl);
      
      return matchType && matchEtat && matchId;
    });
    
    console.log("🔍 Filtres appliqués:", {
      total: this.reclamationsList.length,
      filtered: this.filteredReclamationsList.length,
      filters: {
        type: this.filterTypeRecl,
        etat: this.filterEtatRecl,
        id: this.filterIdRecl
      }
    });
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.filterTypeRecl = '';
    this.filterEtatRecl = '';
    this.filterIdRecl = '';
    this.applyFilters();
  }

  getEtatReclLabel(etat: string): string {
    const option = this.etatReclOptions.find(opt => opt.value === etat);
    return option ? option.label : etat;
  }

  getTypeReclLabel(type: string): string {
    const option = this.typeReclOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEtatReclClass(etat: string): string {
    switch (etat) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-in-progress';
      case 'TRAITEE': return 'status-resolved';
      case 'REJETEE': return 'status-closed';
      default: return 'status-unknown';
    }
  }

  // Méthodes pour les prévisualisations
  generateImagePreview(file: File, type: 'capture' | 'document') {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (type === 'capture') {
        this.capturePreviewUrl = e.target.result;
      } else {
        this.documentPreviewUrl = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  openImagePreview(imageUrl: string, fileName: string) {
    // Créer un modal pour afficher l'image en grand
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      cursor: pointer;
      animation: fadeIn 0.3s ease;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 90%;
      max-height: 80%;
      object-fit: contain;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
    
    const caption = document.createElement('div');
    caption.textContent = fileName;
    caption.style.cssText = `
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 1rem;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 2rem;
      right: 2rem;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 2rem;
      padding: 0.5rem 1rem;
      border-radius: 50%;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;
    
    modal.appendChild(closeBtn);
    modal.appendChild(img);
    modal.appendChild(caption);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Fermer le modal en cliquant dessus ou sur le bouton
    const closeModal = () => {
      document.body.removeChild(modal);
      document.body.style.overflow = 'auto';
    };
    
    modal.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  openPdfPreview(file: File) {
    // Créer une URL pour le fichier PDF
    const pdfUrl = URL.createObjectURL(file);
    
    // Ouvrir dans un nouvel onglet
    const newWindow = window.open(pdfUrl, '_blank');
    if (!newWindow) {
      // Si le popup est bloqué, afficher un message
      this.notificationService.showError('Veuillez autoriser les popups pour prévisualiser le PDF', 3000);
      
      // Alternative: créer un modal avec iframe
      this.createPdfModal(pdfUrl, file.name);
    }
  }

  private createPdfModal(pdfUrl: string, fileName: string) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      backdrop-filter: blur(10px);
    `;
    
    const title = document.createElement('h3');
    title.textContent = fileName;
    title.style.cssText = `
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      font-size: 1.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.cssText = `
      width: 100%;
      height: calc(100% - 80px);
      border: none;
      background: white;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(iframe);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.style.overflow = 'auto';
      URL.revokeObjectURL(pdfUrl);
    });
  }

  // Méthode pour télécharger un PDF de réclamation
  downloadReclamationPdf(reclamation: any): void {
    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF();
      
      // Configuration des couleurs et polices
      const primaryColor = '#e02424'; // Rouge Tunisie Telecom
      const secondaryColor = '#374151';
      const textColor = '#1f2937';
      
      // Logo Tunisie Telecom en base64 (version simplifiée pour le PDF)
      const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDEvMjcvMjQJLWFYAAAAWElEQVR4nO3RAQ0AAAjDsNE/tBn9wgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwA1ESAAEN/uhYAAAAAElFTkSuQmCC';
      
      // Header avec logo et titre
      doc.setFillColor(226, 36, 36); // Rouge TT
      doc.rect(0, 0, 210, 30, 'F');
      
      // Ajouter le logo (si possible) - position top-left dans le header rouge
      try {
        // Charger et afficher le logo depuis le dossier public
        const img = new Image();
        img.onload = () => {
          // Une fois l'image chargée, on peut continuer avec le PDF
          this.generatePdfWithLogo(doc, reclamation, img);
        };
        img.onerror = () => {
          // Si le logo ne peut pas être chargé, continuer sans
          this.generatePdfWithoutLogo(doc, reclamation);
        };
        img.src = 'images/tt-logo.png';
      } catch (error) {
        // En cas d'erreur, continuer sans logo
        this.generatePdfWithoutLogo(doc, reclamation);
      }
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.notificationService.showError('Erreur lors de la génération du PDF');
    }
  }

  // Méthode pour générer le PDF avec logo
  private generatePdfWithLogo(doc: jsPDF, reclamation: any, logoImg: HTMLImageElement): void {
    try {
      // Convertir l'image en canvas pour l'ajouter au PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        ctx.drawImage(logoImg, 0, 0);
        
        const logoDataUrl = canvas.toDataURL('image/png');
        
        // Ajouter le logo au PDF (position dans le header rouge)
        doc.addImage(logoDataUrl, 'PNG', 165, 5, 20, 20);
      }
      
      // Continuer avec le reste du PDF
      this.generatePdfContent(doc, reclamation);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
      // En cas d'erreur, continuer sans logo
      this.generatePdfWithoutLogo(doc, reclamation);
    }
  }

  // Méthode pour générer le PDF sans logo
  private generatePdfWithoutLogo(doc: jsPDF, reclamation: any): void {
    this.generatePdfContent(doc, reclamation);
  }

  // Méthode pour générer le contenu principal du PDF
  private generatePdfContent(doc: jsPDF, reclamation: any): void {
    try {
      const primaryColor = '#e02424';
      const secondaryColor = '#374151';
      const textColor = '#1f2937';
      
      // Titre principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TUNISIE TELECOM', 20, 15);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Récépissé de Réclamation', 20, 23);
      
      // Date de génération
      const currentDate = new Date().toLocaleDateString('fr-FR');
      doc.setFontSize(10);
      doc.text(`Généré le: ${currentDate}`, 120, 23);
      
      // Réinitialiser la couleur du texte
      doc.setTextColor(textColor);
      
      // Informations de la réclamation
      let yPosition = 50;
      
      // ID de réclamation
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Réclamation #${reclamation.idRecl}`, 20, yPosition);
      yPosition += 15;
      
      // Ligne de séparation
      doc.setDrawColor(226, 36, 36);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 15;
      
      // Informations du client
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor);
      doc.text('INFORMATIONS CLIENT', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      
      if (this.currentUser) {
        doc.text(`Nom: ${this.currentUser.prenomUser} ${this.currentUser.nomUser}`, 20, yPosition);
        yPosition += 8;
        doc.text(`Email: ${this.currentUser.emailUser}`, 20, yPosition);
        yPosition += 8;
        if (this.currentUser.numeroLigne) {
          doc.text(`Numéro de ligne: ${this.currentUser.numeroLigne}`, 20, yPosition);
          yPosition += 8;
        }
      }
      yPosition += 10;
      
      // Détails de la réclamation
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor);
      doc.text('DÉTAILS DE LA RÉCLAMATION', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      
      // Type
      doc.text(`Type: ${this.getTypeReclLabel(reclamation.typeRecl)}`, 20, yPosition);
      yPosition += 8;
      
      // État
      doc.text(`État: ${this.getEtatReclLabel(reclamation.etatRecl)}`, 20, yPosition);
      yPosition += 8;
      
      // Date de création
      doc.text(`Date de création: ${this.formatDate(reclamation.dateRecl)}`, 20, yPosition);
      yPosition += 8;
      
      // Date de réponse si disponible
      if (reclamation.dateReponRecl) {
        doc.text(`Date de réponse: ${this.formatDate(reclamation.dateReponRecl)}`, 20, yPosition);
        yPosition += 8;
      }
      yPosition += 5;
      
      // Description
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', 20, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      // Diviser la description en lignes pour qu'elle s'adapte à la page
      const descriptionLines = doc.splitTextToSize(reclamation.descriptionRecl, 170);
      doc.text(descriptionLines, 20, yPosition);
      yPosition += descriptionLines.length * 6 + 10;
      
      // Réponse si disponible
      if (reclamation.descriptionReponRecl) {
        doc.setFont('helvetica', 'bold');
        doc.text('Réponse:', 20, yPosition);
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        const responseLines = doc.splitTextToSize(reclamation.descriptionReponRecl, 170);
        doc.text(responseLines, 20, yPosition);
        yPosition += responseLines.length * 6 + 10;
      }
      
      // Fichiers joints
      // if (reclamation.captureRecl || reclamation.documentRecl) {
      //   doc.setFont('helvetica', 'bold');
      //   doc.text('Fichiers joints:', 20, yPosition);
      //   yPosition += 8;
        
      //   doc.setFont('helvetica', 'normal');
      //   if (reclamation.captureRecl) {
      //     doc.text('• Capture d\'écran: Voir fichier joint', 25, yPosition);
      //     yPosition += 6;
      //   }
      //   if (reclamation.documentRecl) {
      //     doc.text('• Document: Voir fichier joint', 25, yPosition);
      //     yPosition += 6;
      //   }
      //   yPosition += 10;
      // }
      //

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Ce document est généré automatiquement par le système Tunisie Telecom.', 20, pageHeight - 20);
      doc.text(`Réclamation #${reclamation.idRecl} - ${currentDate}`, 20, pageHeight - 12);
      
      // Ligne de séparation footer
      doc.setDrawColor(200, 200, 200);
      doc.line(20, pageHeight - 25, 190, pageHeight - 25);
      
      // Télécharger le PDF
      const fileName = `Reclamation_${reclamation.idRecl}_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      // Afficher une notification de succès
      this.notificationService.showSuccess('PDF téléchargé avec succès!');
      
    } catch (error) {
      console.error('Erreur lors de la génération du contenu PDF:', error);
      this.notificationService.showError('Erreur lors de la génération du PDF');
    }
  }

  // Méthodes pour la suppression de réclamations
  openDeleteConfirmation(reclamation: any) {
    this.reclamationToDelete = reclamation;
    this.isDeleteConfirmationOpen = true;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("🗑️ Ouverture de la confirmation de suppression pour réclamation:", reclamation.idRecl);
  }

  closeDeleteConfirmation() {
    this.isDeleteConfirmationOpen = false;
    this.reclamationToDelete = null;
    this.isDeletingReclamation = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("❌ Fermeture de la confirmation de suppression");
  }

  confirmDeleteReclamation() {
    if (!this.reclamationToDelete || this.isDeletingReclamation) {
      return;
    }

    this.isDeletingReclamation = true;
    const reclamationId = this.reclamationToDelete.idRecl;
    
    console.log("🗑️ Suppression de la réclamation en cours:", reclamationId);

    this.gestionReclamationService.deleteReclamation(reclamationId).subscribe({
      next: (response) => {
        console.log("✅ Réclamation supprimée avec succès:", response);
        this.isDeletingReclamation = false;
        
        // Fermer le modal de confirmation
        this.closeDeleteConfirmation();
        
        // Mettre à jour la liste des réclamations
        this.loadReclamations();
        this.loadReclamationsCount();
        
        // Afficher une notification de succès
        this.notificationService.showSuccess('Réclamation supprimée avec succès !', 4000);
      },
      error: (error) => {
        console.error("❌ Erreur lors de la suppression de la réclamation:", error);
        this.isDeletingReclamation = false;
        
        let errorMessage = 'Une erreur s\'est produite lors de la suppression de la réclamation.';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour supprimer cette réclamation.';
        } else if (error.status === 404) {
          errorMessage = 'Réclamation non trouvée.';
        }
        
        this.notificationService.showError(errorMessage, 5000);
      }
    });
  }

  // ========== MÉTHODE UTILITAIRE POUR UPLOAD ==========

  /**
   * Upload un fichier et retourne l'URL
   */
  private uploadFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this.gestionUserService.uploadFile(file).subscribe({
        next: (response) => {
          console.log('✅ Upload réussi:', response);
          // Le service peut retourner différents formats, on essaie de récupérer l'URL
          let url = '';
          if (typeof response === 'string') {
            url = response;
          } else if (response && response.url) {
            url = response.url;
          } else if (response && response.filePath) {
            url = response.filePath;
          } else {
            url = response;
          }
          resolve(url);
        },
        error: (error) => {
          console.error('❌ Erreur upload:', error);
          reject(error);
        }
      });
    });
  }

  // ========== MÉTHODES DE MODIFICATION DES RÉCLAMATIONS ==========

  /**
   * Vérifie si une réclamation peut être modifiée (seulement si elle est en attente)
   */
  canEditReclamation(reclamation: any): boolean {
    return reclamation && reclamation.etatRecl === 'EN_ATTENTE';
  }

  /**
   * Ouvre le modal de modification d'une réclamation
   */
  openEditReclamationModal(reclamation: any) {
    if (!this.canEditReclamation(reclamation)) {
      this.notificationService.showError(
        'Cette réclamation ne peut être modifiée que si elle est en attente.', 
        4000
      );
      return;
    }

    console.log("✏️ Ouverture du modal de modification pour la réclamation:", reclamation.idRecl);
    
    this.reclamationToEdit = { ...reclamation };
    this.isEditReclamationModalOpen = true;
    
    // Pré-remplir le formulaire avec les données existantes
    this.editReclamationForm.patchValue({
      typeRecl: reclamation.typeRecl,
      sujetRecl: reclamation.sujetRecl || '',
      numeroConcerne: reclamation.numeroConcerne || '',
      descriptionRecl: reclamation.descriptionRecl
    });

    // Mettre à jour les options du sujet selon le type
    this.updateSujetReclOptions(reclamation.typeRecl);

    // Réinitialiser les fichiers
    this.editSelectedCaptureFile = null;
    this.editSelectedDocumentFile = null;
    this.editCapturePreviewUrl = null;
    this.editDocumentPreviewUrl = null;

    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
  }

  /**
   * Ferme le modal de modification de réclamation
   */
  closeEditReclamationModal() {
    this.isEditReclamationModalOpen = false;
    this.reclamationToEdit = null;
    this.editReclamationForm.reset();
    
    // Réinitialiser les fichiers et prévisualisations
    this.editSelectedCaptureFile = null;
    this.editSelectedDocumentFile = null;
    this.editCapturePreviewUrl = null;
    this.editDocumentPreviewUrl = null;
    this.isUploadingEditCapture = false;
    this.isUploadingEditDocument = false;
    
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("❌ Fermeture du modal de modification");
  }

  /**
   * Gestion des fichiers pour la modification - Capture
   */
  onEditCaptureFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vérifications
      if (!file.type.startsWith('image/')) {
        this.notificationService.showError('Veuillez sélectionner un fichier image valide.', 4000);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.notificationService.showError('La taille de l\'image ne doit pas dépasser 5MB.', 4000);
        return;
      }

      this.editSelectedCaptureFile = file;
      
      // Créer une prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editCapturePreviewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Gestion des fichiers pour la modification - Document
   */
  onEditDocumentFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vérifications
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.notificationService.showError('Formats acceptés : PNG, JPG, JPEG, PDF', 4000);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        this.notificationService.showError('La taille du fichier ne doit pas dépasser 10MB.', 4000);
        return;
      }

      this.editSelectedDocumentFile = file;
      
      // Créer une prévisualisation pour les images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.editDocumentPreviewUrl = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        this.editDocumentPreviewUrl = null;
      }
    }
  }

  /**
   * Déclenche la sélection de fichier capture pour modification
   */
  triggerEditCaptureUpload() {
    const fileInput = document.getElementById('editCaptureFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Déclenche la sélection de fichier document pour modification
   */
  triggerEditDocumentUpload() {
    const fileInput = document.getElementById('editDocumentFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Supprime le fichier capture sélectionné pour modification
   */
  removeEditCaptureFile() {
    this.editSelectedCaptureFile = null;
    this.editCapturePreviewUrl = null;
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('editCaptureFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Supprime le fichier document sélectionné pour modification
   */
  removeEditDocumentFile() {
    this.editSelectedDocumentFile = null;
    this.editDocumentPreviewUrl = null;
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('editDocumentFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Soumet la modification de la réclamation
   */
  async submitEditReclamation() {
    if (this.editReclamationForm.invalid || this.isEditingReclamation || !this.reclamationToEdit) {
      return;
    }

    this.isEditingReclamation = true;
    console.log("✏️ Soumission de la modification de réclamation en cours...");

    try {
      // Upload des fichiers si nécessaires
      let captureUrl = this.reclamationToEdit.captureRecl || '';
      let documentUrl = this.reclamationToEdit.documentRecl || '';

      // Upload capture si nouveau fichier
      if (this.editSelectedCaptureFile) {
        this.isUploadingEditCapture = true;
        try {
          captureUrl = await this.uploadFile(this.editSelectedCaptureFile);
          console.log("✅ Capture uploadée:", captureUrl);
        } catch (error) {
          console.error("❌ Erreur upload capture:", error);
          this.notificationService.showError('Erreur lors de l\'upload de la capture', 4000);
          this.isUploadingEditCapture = false;
          this.isEditingReclamation = false;
          return;
        }
        this.isUploadingEditCapture = false;
      }

      // Upload document si nouveau fichier
      if (this.editSelectedDocumentFile) {
        this.isUploadingEditDocument = true;
        try {
          documentUrl = await this.uploadFile(this.editSelectedDocumentFile);
          console.log("✅ Document uploadé:", documentUrl);
        } catch (error) {
          console.error("❌ Erreur upload document:", error);
          this.notificationService.showError('Erreur lors de l\'upload du document', 4000);
          this.isUploadingEditDocument = false;
          this.isEditingReclamation = false;
          return;
        }
        this.isUploadingEditDocument = false;
      }

      // Créer l'objet réclamation modifié
      const updatedReclamation: Reclamation = {
        idRecl: this.reclamationToEdit.idRecl,
        typeRecl: this.editReclamationForm.get('typeRecl')?.value as TypeRecl,
        sujetRecl: this.editReclamationForm.get('sujetRecl')?.value,
        numeroConcerne: this.editReclamationForm.get('numeroConcerne')?.value,
        descriptionRecl: this.editReclamationForm.get('descriptionRecl')?.value,
        captureRecl: captureUrl,
        documentRecl: documentUrl,
        etatRecl: this.reclamationToEdit.etatRecl,
        dateRecl: this.reclamationToEdit.dateRecl,
        descriptionReponRecl: this.reclamationToEdit.descriptionReponRecl,
        dateReponRecl: this.reclamationToEdit.dateReponRecl,
        utilisateurRecl: this.reclamationToEdit.utilisateurRecl,
        avisRecl: this.reclamationToEdit.avisRecl
      };

      console.log("📤 Envoi de la réclamation modifiée:", updatedReclamation);

      // Appel du service
      this.gestionReclamationService.modifierReclamation(this.reclamationToEdit.idRecl, updatedReclamation).subscribe({
        next: (response) => {
          console.log("✅ Réclamation modifiée avec succès:", response);
          this.isEditingReclamation = false;

          // Gérer la réponse selon le format du backend
          let updatedData;
          if (response && response.body) {
            // Si la réponse a un format avec body
            updatedData = response.body;
          } else {
            // Si la réponse est directement l'objet
            updatedData = response;
          }

          // Mettre à jour la liste des réclamations
          const index = this.reclamationsList.findIndex(r => r.idRecl === this.reclamationToEdit!.idRecl);
          if (index !== -1 && updatedData) {
            this.reclamationsList[index] = updatedData;
            this.applyFilters();
          }

          // Fermer le modal
          this.closeEditReclamationModal();

          // Afficher un message de succès
          this.notificationService.showSuccess('Réclamation modifiée avec succès !', 4000);
        },
        error: (error) => {
          console.error("❌ Erreur lors de la modification de la réclamation:", error);
          this.isEditingReclamation = false;

          let errorMessage = 'Une erreur s\'est produite lors de la modification de la réclamation.';
          
          // Gérer les différents types d'erreurs selon le backend
          if (error.status === 400) {
            // Erreur de validation du backend
            if (error.error && typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error && error.error.body && typeof error.error.body === 'string') {
              errorMessage = error.error.body;
            } else {
              errorMessage = 'La réclamation ne peut être modifiée que si elle est en attente.';
            }
          } else if (error.status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          } else if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions pour modifier cette réclamation.';
          } else if (error.status === 404) {
            errorMessage = 'Réclamation non trouvée.';
          }

          this.notificationService.showError(errorMessage, 5000);
        }
      });

    } catch (error) {
      console.error("❌ Erreur générale lors de la modification:", error);
      this.isEditingReclamation = false;
      this.notificationService.showError('Une erreur inattendue s\'est produite.', 4000);
    }
  }

  // ========== MÉTHODES POUR LES AVIS ==========

  /**
   * Vérifie si une réclamation peut recevoir un avis (seulement si elle est résolue/traitée et n'a pas déjà d'avis)
   */
  canGiveAvis(reclamation: any): boolean {
    return reclamation && 
           reclamation.etatRecl === 'TRAITEE' && 
           !reclamation.avisRecl; // Vérifier qu'il n'y a pas déjà un avis
  }

  /**
   * Ouvre le modal d'avis pour une réclamation
   */
  openAvisModal(reclamation: any) {
    if (!this.canGiveAvis(reclamation)) {
      // Déterminer le message d'erreur approprié
      let errorMessage = '';
      if (reclamation.etatRecl !== 'TRAITEE') {
        errorMessage = 'Vous ne pouvez donner un avis que sur les réclamations résolues.';
      } else if (reclamation.avisRecl) {
        errorMessage = 'Vous avez déjà donné un avis pour cette réclamation.';
      } else {
        errorMessage = 'Impossible de donner un avis pour cette réclamation.';
      }
      
      this.notificationService.showError(errorMessage, 4000);
      return;
    }

    console.log("⭐ Ouverture du modal d'avis pour la réclamation:", reclamation.idRecl);
    
    this.currentReclamationForAvis = reclamation;
    this.isAvisModalOpen = true;
    
    // Réinitialiser le formulaire
    this.avisForm.reset();

    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
  }

  /**
   * Ferme le modal d'avis
   */
  closeAvisModal() {
    this.isAvisModalOpen = false;
    this.currentReclamationForAvis = null;
    this.avisForm.reset();
    this.isSubmittingAvis = false;
    
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("❌ Fermeture du modal d'avis");
  }

  /**
   * Soumet l'avis
   */
  submitAvis() {
    if (this.avisForm.invalid || this.isSubmittingAvis || !this.currentReclamationForAvis) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.avisForm.controls).forEach(key => {
        this.avisForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmittingAvis = true;
    console.log("⭐ Soumission de l'avis en cours...");

    // Créer l'objet avis selon le modèle Avis
    const avis = new Avis();
    avis.descriptionAvis = this.avisForm.get('commentaire')?.value;
    avis.note = this.avisForm.get('note')?.value;
    // avis.commentaire = this.avisForm.get('commentaire')?.value;
    // avis.dateAvis = new Date().toISOString();
    // avis.clientId = this.currentUser.idUser;
    // avis.reclamationId = this.currentReclamationForAvis.idRecl;

    console.log("📤 Données de l'avis à soumettre:", avis);

    // Appel du service d'avis
    this.gestionAvisService.addAvis(this.currentReclamationForAvis.idRecl, avis).subscribe({
      next: (response) => {
        console.log("✅ Avis soumis avec succès:", response);
        this.isSubmittingAvis = false;
        
        // Fermer le modal
        this.closeAvisModal();
        
        // Recharger les réclamations pour mettre à jour l'affichage
        this.loadReclamations();
        this.loadReclamationsCount();
        
        // Afficher un message de succès
        this.notificationService.showSuccess('Votre avis a été soumis avec succès !', 4000);
      },
      error: (error) => {
        console.error("❌ Erreur lors de la soumission de l'avis:", error);
        this.isSubmittingAvis = false;
        
        let errorMessage = 'Une erreur s\'est produite lors de la soumission de l\'avis.';
        if (error.status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour donner un avis.';
        } else if (error.status === 400) {
          errorMessage = 'Données d\'avis invalides. Veuillez vérifier vos informations.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        this.notificationService.showError(errorMessage, 5000);
      }
    });
  }

  /**
   * Met à jour l'affichage des étoiles selon la note sélectionnée
   */
  setStarRating(rating: number) {
    this.avisForm.patchValue({ note: rating });
  }

  /**
   * Retourne le nombre d'étoiles pleines selon la note
   */
  getStarRating(): number {
    return this.avisForm.get('note')?.value || 0;
  }

}