import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangePasswordRequest } from '../../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../../core/models/ChangePhoto';
import { UserRegistrationRequest } from '../../../../core/models/UserRegistrationRequest';
import { Utilisateur } from '../../../../core/models/Utilisateur';
import { GestionreclamationService } from '../../../services/gestionReclamationService/gestionreclamation.service';
import { GestionRenseignementService } from '../../../services/gestionRenseignementService/gestion-renseignement.service';
import { GestionuserService } from '../../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../../services/notification.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-adminhome',
  imports: [NgFor, NgIf, NgClass, ReactiveFormsModule, FormsModule],
  templateUrl: './adminhome.component.html',
  styleUrl: './adminhome.component.css'
})
export class AdminhomeComponent implements OnInit, OnDestroy {
    agents: Utilisateur[] = [];
    clients: Utilisateur[] = [];

  isDropdownOpen = false;
  currentUser: any = null;
  
  // Variable pour le menu mobile
  isMobileMenuOpen = false;
  
  // Variables pour le modal de changement de mot de passe
  isChangePasswordModalOpen = false;
  changePasswordForm: FormGroup;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  isChangingPassword = false;

  // Variables pour le modal d'informations utilisateur
  isUserInfoModalOpen = false;

  // Variables pour la mise à jour de la photo
  isUpdatingPhoto = false;

  // Variables pour le modal des réclamations
  isReclamationsModalOpen = false;
  reclamationsList: any[] = [];
  filteredReclamationsList: any[] = [];
  isLoadingReclamations = false;
  
  // Variables pour les filtres des réclamations
  filterIdRecl = '';
  filterEtatRecl = '';
  filterEmailClient = '';

  // Variables pour le modal des renseignements admin
  isRenseignementsModalOpen = false;
  renseignementsList: any[] = [];
  filteredRenseignementsList: any[] = [];
  isLoadingRenseignements = false;
  
  // Variables pour les filtres des renseignements admin
  filterIdRens = '';
  filterSujetRens = '';
  filterEmailClientRens = '';

  // Options pour les filtres des renseignements admin
  sujetRensOptions = [
    { value: '', label: 'Tous les sujets' },
    { value: 'Identité Numérique e-Houwiya', label: 'Identité Numérique e-Houwiya' },
    { value: 'Internet Mobile', label: 'Internet Mobile' },
    { value: 'Fixe', label: 'Fixe' },
    { value: 'Mobile', label: 'Mobile' },
    { value: 'Application MY TT', label: 'Application MY TT' },
    { value: 'Linkedin', label: 'Linkedin' },
    { value: 'Youtube', label: 'Youtube' },
    { value: 'Twitter X', label: 'Twitter X' },
    { value: 'FB/Messenger', label: 'FB/Messenger' },
    { value: 'Portail', label: 'Portail' }
  ];
  
  // Variables pour le modal de statistiques
  isStatsModalOpen = false;
  statsData: any = {
    totalReclamations: 0,
    enAttente: 0,
    enCours: 0,
    traitees: 0,
    rejetees: 0,
    parClient: [],
    parType: [],
    evolutionMensuelle: []
  };
  isLoadingStats = false;
  
  // Options pour les filtres des réclamations
  etatReclOptions = [
    { value: '', label: 'Tous les états' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TRAITEE', label: 'Traitée' },
    { value: 'REJETEE', label: 'Rejetée' }
  ];

  // Date actuelle pour l'affichage
  currentDate = new Date().toLocaleDateString('fr-FR');

 

  
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private gestionUserService: GestionuserService,
    private gestionReclamationService: GestionreclamationService,
    private gestionRenseignementService: GestionRenseignementService,
    private userStateService: UserStateService,
    private notificationService: NotificationService
  ) {
    // Initialiser le formulaire de changement de mot de passe
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Initialiser le formulaire de création d'utilisateur
    this.createUserForm = this.fb.group({
      nomUser: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenomUser: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      emailUser: ['', [Validators.required, Validators.email]],
      numeroLigne: ['', [Validators.min(0), Validators.max(99999999)]],
      idRole: ['', [Validators.required]]
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
        this.fetchClients();
        this.fetchAgents();
        this.fetchReclamations();
        this.fetchRenseignements();
        
    // Récupérer les données de l'utilisateur connecté
    this.currentUser = this.gestionUserService.getCurrentUser();
    
    // S'abonner aux changements d'état de l'utilisateur
    this.userStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Vérifier si l'utilisateur est connecté et a le rôle admin
    if (!this.gestionUserService.isAuthenticated() || !this.currentUser) {
      this.router.navigate(['/login']);
    } else if (this.currentUser.role !== 'ROLE_ADMIN') {
      this.router.navigate(['/login']);
    }
    
    // Charger les activités récentes
    this.loadRecentActivities();
  }



   /**
   * Charge tous les clients depuis le service
   */
 fetchClients(): void {
  // appel vers l'API pour récupérer les clients
  this.gestionUserService.getAllClients().subscribe(data => {
    this.clients = data;
   this.adminStats.totalClient = this.clients.length;
   // Recharger les activités récentes après avoir récupéré les clients
   this.loadRecentActivities();
  });
}

    /**
   * Charge tous les agents
   */
  fetchAgents(): void {
  // appel vers l'API pour récupérer les agents
  this.gestionUserService.getAllAgents().subscribe(data => {
    this.agents = data;
    this.adminStats.totalAgent = this.agents.length;
    // Recharger les activités récentes après avoir récupéré les agents
    this.loadRecentActivities();
  });
}

  /**
   * Charge tous les agents
   */
  fetchReclamations(): void {
  // appel vers l'API pour récupérer les réclamations
  this.gestionReclamationService.getAllReclamations().subscribe(data => {
    this.reclamationsList = data;
    this.adminStats.totalreclamation = this.reclamationsList.length;
    // Recharger les activités récentes après avoir récupéré les réclamations
    this.loadRecentActivities();
  });
}

  /**
   * Charge tous les renseignements
   */
  fetchRenseignements(): void {
    // appel vers l'API pour récupérer les renseignements
    this.gestionRenseignementService.getAllRenseignements().subscribe(data => {
      this.renseignementsList = data;
      this.adminStats.Renseignement = this.renseignementsList.length;
      // Recharger les activités récentes après avoir récupéré les renseignements
      this.loadRecentActivities();
    });
  }

   // Statistiques admin (exemple)
  adminStats = {
    totalClient: 0,
    totalreclamation: 0,
    totalAgent: 0,
    Renseignement: 0
  };

  // Activités récentes (données dynamiques)
  recentActivities: any[] = [];
  isLoadingActivities = false;


  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isDropdownOpen = false;
    }
    if (!target.closest('.mobile-menu-toggle') && !target.closest('.admin-nav')) {
      this.isMobileMenuOpen = false;
    }
  }

  navigateToAccount() {
    this.isDropdownOpen = false;
    this.isUserInfoModalOpen = true;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("Opening admin info modal");
  }

  logout() {
    this.isDropdownOpen = false;
    this.gestionUserService.logout();
    console.log("Admin logged out");
  }

  // Gestion d'erreur d'image pour avatar par défaut
  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2Yzc1N2QiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM3MyIDQgNC41IDcuNVM5LjUgMTIgMTIgMTJaTTEyIDEzLjVjLTMgMC04IDEuNS04IDQuNXYyaDEydi0yYzAtM3M1LTQuNS04LTQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
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

      console.log("🔐 Changement de mot de passe admin en cours...");
      
      this.gestionUserService.changePassword(changePasswordRequest).subscribe({
        next: (response) => {
          console.log("✅ Mot de passe admin changé avec succès:", response);
          this.isChangingPassword = false;
          
          // Afficher une notification de succès
          this.notificationService.showSuccess('Mot de passe changé avec succès !', 4000);
          
          // Fermer le modal
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error("❌ Erreur lors du changement de mot de passe admin:", error);
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


   closePhotoModal() {
    this.isPhotoModalOpen = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("Modal photo fermé pour l'agent");
  }
  isPhotoModalOpen=false
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
  // Méthodes pour la gestion de l'upload de photo de profil
  
  // Méthode pour ouvrir le sélecteur de fichier
  onProfilePhotoClick() {
    if (this.isUpdatingPhoto) return;
    
    console.log("🖼️ Clic sur la photo de profil admin - Ouverture du sélecteur de fichier");
    
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
        
        console.log("🔄 Mise à jour de la photo admin:", changePhoto);
        
        this.gestionUserService.updatePhoto(this.currentUser.idUser, changePhoto).subscribe({
          next: (response) => {
            console.log("✅ Photo admin mise à jour avec succès:", response);
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
            console.error("❌ Erreur lors de la mise à jour de la photo admin:", error);
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

  ngOnDestroy(): void {
    // S'assurer que le scroll est restauré si le composant est détruit
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen || this.isReclamationsModalOpen || this.isCreateUserModalOpen) {
      document.body.style.overflow = 'auto';
    }
  }

  // Méthodes de navigation admin
  navigateToUserManagement() {
    console.log("Navigation vers gestion utilisateurs");
    this.router.navigate(['/admin/user-management']);
  }

  navigateToServiceManagement() {
    console.log("Navigation vers création de comptes - Ouverture popup création");
    this.openCreateUserModal();
  }

  // Variable pour le modal de création d'utilisateur
  isCreateUserModalOpen = false;
  createUserForm: FormGroup;
  isCreating = false;

  // Méthodes pour le modal de création d'utilisateur
  openCreateUserModal() {
    this.isCreateUserModalOpen = true;
    // Reset the form instead of creating a new one
    this.createUserForm.reset();
    document.body.style.overflow = 'hidden';
    console.log("Modal création utilisateur ouvert");
  }

  closeCreateUserModal() {
    this.isCreateUserModalOpen = false;
    this.createUserForm.reset();
    this.isCreating = false;
    document.body.style.overflow = 'auto';
    console.log("Modal création utilisateur fermé");
  }

  createUser() {
    if (this.createUserForm.invalid) {
      this.markFormGroupTouched(this.createUserForm);
      this.notificationService.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isCreating = true;
    const formData = this.createUserForm.value;
    
    // Créer l'objet de requête d'inscription avec le modèle correct
    const registrationRequest = new UserRegistrationRequest();
    registrationRequest.nomUser = formData.nomUser?.trim();
    registrationRequest.prenomUser = formData.prenomUser?.trim();
    registrationRequest.emailUser = formData.emailUser?.toLowerCase().trim();
    registrationRequest.numeroLigne = formData.numeroLigne || 0;
    registrationRequest.idRole = parseInt(formData.idRole);
    // Les champs suivants sont optionnels pour la création par admin
    registrationRequest.photoUser = '';
    registrationRequest.passwordUser = '';
    registrationRequest.documentContrat = '';

    console.log('🔄 Création d\'un compte utilisateur...', registrationRequest);

    this.gestionUserService.creerCompteByAdmin(registrationRequest).subscribe({
      next: (response) => {
        console.log('✅ Compte créé avec succès:', response);
        let roleText = 'client';
        if (formData.idRole === '1') {
          roleText = 'administrateur';
        } else if (formData.idRole === '2') {
          roleText = 'agent';
        }
        
        this.notificationService.showSuccess(`Compte ${roleText} créé avec succès pour ${formData.prenomUser} ${formData.nomUser}`);
        this.closeCreateUserModal();
        
        // Actualiser les statistiques
        this.fetchClients();
        this.fetchAgents();
        
        this.isCreating = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du compte:', error);
        let errorMessage = 'Erreur lors de la création du compte';
        
        if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies';
        } else if (error.status === 409) {
          errorMessage = 'Cette adresse email est déjà utilisée';
        } else if (error.status === 422) {
          errorMessage = 'Format des données incorrect';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard';
        }
        
        this.notificationService.showError(errorMessage);
        this.isCreating = false;
      }
    });
  }

  // Méthode utilitaire pour marquer tous les champs comme touchés
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  navigateToReports() {
    this.openStatsModal();
  }

  // navigateToSettings() {
  //   console.log("Navigation vers paramètres");
  //   // Implémenter la navigation
  // }

  // Méthodes pour le modal des réclamations
  openReclamationsModal() {
    this.isReclamationsModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.loadAllReclamations();
    console.log("Modal réclamations admin ouvert");
  }

  closeReclamationsModal() {
    this.isReclamationsModalOpen = false;
    document.body.style.overflow = 'auto';
    // Réinitialiser les filtres
    this.filterIdRecl = '';
    this.filterEtatRecl = '';
    this.filterEmailClient = '';
    console.log("Modal réclamations admin fermé");
  }

  loadAllReclamations() {
    this.isLoadingReclamations = true;
    console.log("📋 Chargement de toutes les réclamations...");

    this.gestionReclamationService.getAllReclamations().subscribe({
      next: (response: any) => {
        console.log("✅ Réclamations chargées:", response);
        this.reclamationsList = response || [];
        this.applyReclamationsFilters();
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
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour voir les réclamations.';
        }
        
        this.notificationService.showError(errorMessage, 4000);
      }
    });
  }

  applyReclamationsFilters() {
    this.filteredReclamationsList = this.reclamationsList.filter(reclamation => {
      const matchId = !this.filterIdRecl || reclamation.idRecl.toString().includes(this.filterIdRecl);
      const matchEtat = !this.filterEtatRecl || reclamation.etatRecl === this.filterEtatRecl;
      const matchEmail = !this.filterEmailClient || 
        (reclamation.utilisateurRecl?.emailUser && 
         reclamation.utilisateurRecl.emailUser.toLowerCase().includes(this.filterEmailClient.toLowerCase()));
      
      return matchId && matchEtat && matchEmail;
    });
    
    console.log("🔍 Filtres appliqués sur les réclamations:", {
      total: this.reclamationsList.length,
      filtered: this.filteredReclamationsList.length,
      filters: {
        id: this.filterIdRecl,
        etat: this.filterEtatRecl,
        email: this.filterEmailClient
      }
    });
  }

  onReclamationsFilterChange() {
    this.applyReclamationsFilters();
  }

  clearReclamationsFilters() {
    this.filterIdRecl = '';
    this.filterEtatRecl = '';
    this.filterEmailClient = '';
    this.applyReclamationsFilters();
  }

  getEtatReclLabel(etat: string): string {
    const option = this.etatReclOptions.find(opt => opt.value === etat);
    return option ? option.label : etat;
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

  getTypeReclLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'Mon_compte_MY_TT': 'Mon compte MY TT',
      'Mon_Mobile': 'Mon Mobile',
      'Internet_Mobile': 'Internet Mobile',
      'Mon_Fixe': 'Mon Fixe',
      'Service_e_Facture': 'Service e-Facture'
    };
    return typeLabels[type] || type;
  }

  // Méthodes pour le modal de statistiques
  openStatsModal() {
    this.isStatsModalOpen = true;
    this.loadStatistics();
  }

  closeStatsModal() {
    this.isStatsModalOpen = false;
  }

  loadStatistics() {
    this.isLoadingStats = true;
    
    this.gestionReclamationService.getAllReclamations().subscribe({
      next: (reclamations) => {
        this.calculateStatistics(reclamations);
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        this.isLoadingStats = false;
      }
    });
  }

  calculateStatistics(reclamations: any[]) {
    // Statistiques globales
    this.statsData.totalReclamations = reclamations.length;
    this.statsData.enAttente = reclamations.filter(r => r.etatRecl === 'EN_ATTENTE').length;
    this.statsData.enCours = reclamations.filter(r => r.etatRecl === 'EN_COURS').length;
    this.statsData.traitees = reclamations.filter(r => r.etatRecl === 'TRAITEE').length;
    this.statsData.rejetees = reclamations.filter(r => r.etatRecl === 'REJETEE').length;

    // Statistiques par client
    const clientStats = new Map();
    reclamations.forEach(reclamation => {
      if (reclamation.utilisateurRecl) {
        const clientKey = `${reclamation.utilisateurRecl.prenomUser} ${reclamation.utilisateurRecl.nomUser}`;
        const clientEmail = reclamation.utilisateurRecl.emailUser;
        
        if (!clientStats.has(clientKey)) {
          clientStats.set(clientKey, {
            nom: clientKey,
            email: clientEmail,
            total: 0,
            enAttente: 0,
            enCours: 0,
            traitees: 0,
            rejetees: 0
          });
        }
        
        const client = clientStats.get(clientKey);
        client.total++;
        
        switch (reclamation.etatRecl) {
          case 'EN_ATTENTE': client.enAttente++; break;
          case 'EN_COURS': client.enCours++; break;
          case 'TRAITEE': client.traitees++; break;
          case 'REJETEE': client.rejetees++; break;
        }
      }
    });
    
    this.statsData.parClient = Array.from(clientStats.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 clients

    // Statistiques par type
    const typeStats = new Map();
    reclamations.forEach(reclamation => {
      const typeKey = reclamation.typeRecl;
      
      if (!typeStats.has(typeKey)) {
        typeStats.set(typeKey, {
          type: this.getTypeReclLabel(typeKey),
          total: 0,
          enAttente: 0,
          enCours: 0,
          traitees: 0,
          rejetees: 0
        });
      }
      
      const type = typeStats.get(typeKey);
      type.total++;
      
      switch (reclamation.etatRecl) {
        case 'EN_ATTENTE': type.enAttente++; break;
        case 'EN_COURS': type.enCours++; break;
        case 'TRAITEE': type.traitees++; break;
        case 'REJETEE': type.rejetees++; break;
      }
    });
    
    this.statsData.parType = Array.from(typeStats.values())
      .sort((a, b) => b.total - a.total);

    // Évolution mensuelle (derniers 6 mois)
    const now = new Date();
    const evolutionData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      const monthReclamations = reclamations.filter(r => {
        const reclDate = new Date(r.dateRecl);
        return reclDate.getMonth() === date.getMonth() && 
               reclDate.getFullYear() === date.getFullYear();
      });
      
      evolutionData.push({
        mois: monthKey,
        total: monthReclamations.length,
        enAttente: monthReclamations.filter(r => r.etatRecl === 'EN_ATTENTE').length,
        enCours: monthReclamations.filter(r => r.etatRecl === 'EN_COURS').length,
        traitees: monthReclamations.filter(r => r.etatRecl === 'TRAITEE').length,
        rejetees: monthReclamations.filter(r => r.etatRecl === 'REJETEE').length
      });
    }
    
    this.statsData.evolutionMensuelle = evolutionData;

    console.log('📊 Statistiques calculées:', this.statsData);
  }

  // Méthodes pour le modal des renseignements admin
  openRenseignementsModal() {
    this.isRenseignementsModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.loadAllRenseignementsForModal();
    console.log("Modal renseignements admin ouvert");
  }

  closeRenseignementsModal() {
    this.isRenseignementsModalOpen = false;
    document.body.style.overflow = 'auto';
    // Réinitialiser les filtres
    this.filterIdRens = '';
    this.filterSujetRens = '';
    this.filterEmailClientRens = '';
    console.log("Modal renseignements admin fermé");
  }

  loadAllRenseignementsForModal() {
    this.isLoadingRenseignements = true;
    console.log("📋 Chargement de tous les renseignements pour l'admin...");

    this.gestionRenseignementService.getAllRenseignements().subscribe({
      next: (response: any) => {
        console.log("✅ Renseignements chargés pour le modal admin:", response);
        this.renseignementsList = response || [];
        this.applyRenseignementsFilters();
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
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions pour voir les renseignements.';
        }
        
        this.notificationService.showError(errorMessage, 4000);
      }
    });
  }

  applyRenseignementsFilters() {
    this.filteredRenseignementsList = this.renseignementsList.filter(renseignement => {
      const matchId = !this.filterIdRens || renseignement.idRens.toString().includes(this.filterIdRens);
      const matchSujet = !this.filterSujetRens || renseignement.sujetRens === this.filterSujetRens;
      const matchEmail = !this.filterEmailClientRens || 
        (renseignement.utilisateurRens?.emailUser && 
         renseignement.utilisateurRens.emailUser.toLowerCase().includes(this.filterEmailClientRens.toLowerCase())) ||
        (renseignement.utilisateurRens?.email && 
         renseignement.utilisateurRens.email.toLowerCase().includes(this.filterEmailClientRens.toLowerCase()));
      
      return matchId && matchSujet && matchEmail;
    });
    
    console.log("🔍 Filtres appliqués sur les renseignements admin:", {
      total: this.renseignementsList.length,
      filtered: this.filteredRenseignementsList.length,
      filters: {
        id: this.filterIdRens,
        sujet: this.filterSujetRens,
        email: this.filterEmailClientRens
      }
    });
  }

  onRenseignementsFilterChange() {
    this.applyRenseignementsFilters();
  }

  clearRenseignementsFilters() {
    this.filterIdRens = '';
    this.filterSujetRens = '';
    this.filterEmailClientRens = '';
    this.applyRenseignementsFilters();
  }

  getSujetRensLabel(sujet: string): string {
    const option = this.sujetRensOptions.find(opt => opt.value === sujet);
    return option ? option.label : sujet;
  }

  getRenseignementStatusClass(renseignement: any): string {
    return renseignement.descriptionReponRens ? 'status-resolved' : 'status-pending';
  }

  getRenseignementStatusLabel(renseignement: any): string {
    return renseignement.descriptionReponRens ? 'Résolu' : 'En attente';
  }

  /**
   * Charge les activités récentes basées sur les vraies données
   */
  loadRecentActivities(): void {
    this.isLoadingActivities = true;
    this.recentActivities = [];

    try {
      // Récupérer les réclamations récentes (5 dernières)
      const recentReclamations = this.reclamationsList
        .sort((a, b) => new Date(b.dateRecl).getTime() - new Date(a.dateRecl).getTime())
        .slice(0, 3);

      // Récupérer les renseignements récents (3 derniers)
      const recentRenseignements = this.renseignementsList
        .sort((a, b) => new Date(b.dateRens).getTime() - new Date(a.dateRens).getTime())
        .slice(0, 2);

      // Récupérer les nouveaux utilisateurs (3 derniers)
      const allUsers = [...this.clients, ...this.agents];
      const recentUsers = allUsers
        .filter(user => user.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2);

      // Transformer les réclamations en activités
      recentReclamations.forEach(reclamation => {
        const clientName = reclamation.utilisateurRecl ? 
          `${reclamation.utilisateurRecl.prenomUser} ${reclamation.utilisateurRecl.nomUser}` : 
          'Client inconnu';
        
        this.recentActivities.push({
          type: this.getReclamationActivityType(reclamation.etatRecl),
          message: `Réclamation #${reclamation.idRecl} - ${this.getTypeReclLabel(reclamation.typeRecl)} par ${clientName}`,
          time: this.getRelativeTime(reclamation.dateRecl),
          icon: this.getReclamationIcon(reclamation.etatRecl),
          date: new Date(reclamation.dateRecl)
        });
      });

      // Transformer les renseignements en activités
      recentRenseignements.forEach(renseignement => {
        const clientName = renseignement.utilisateurRens ? 
          `${renseignement.utilisateurRens.prenomUser || renseignement.utilisateurRens.prenom} ${renseignement.utilisateurRens.nomUser || renseignement.utilisateurRens.nom}` : 
          'Client inconnu';
        
        const status = renseignement.descriptionReponRens ? 'résolu' : 'en attente';
        this.recentActivities.push({
          type: renseignement.descriptionReponRens ? 'renseignement-resolved' : 'renseignement-pending',
          message: `Renseignement #${renseignement.idRens} ${status} - ${this.getSujetRensLabel(renseignement.sujetRens)} par ${clientName}`,
          time: this.getRelativeTime(renseignement.dateRens),
          icon: renseignement.descriptionReponRens ? '✅' : '💬',
          date: new Date(renseignement.dateRens)
        });
      });

      // Transformer les nouveaux utilisateurs en activités
      recentUsers.forEach(user => {
        const userName = `${user.prenomUser} ${user.nomUser}`;
        const role = this.getUserRoleLabel(user.role?.toString() || 'ROLE_CLIENT');
        
        this.recentActivities.push({
          type: 'user-created',
          message: `Nouveau ${role} inscrit: ${userName}`,
          time: this.getRelativeTime(user.createdAt?.toString() || new Date().toISOString()),
          icon: this.getUserIcon(user.role?.toString() || 'ROLE_CLIENT'),
          date: new Date(user.createdAt || new Date())
        });
      });

      // Ajouter quelques activités système statiques si nécessaire
      if (this.recentActivities.length < 5) {
        this.recentActivities.push(
          {
            type: 'system',
            message: 'Sauvegarde automatique des données effectuée',
            time: 'Il y a 3 heures',
            icon: '💾',
            date: new Date(Date.now() - 3 * 60 * 60 * 1000)
          },
          {
            type: 'system',
            message: 'Mise à jour de sécurité installée',
            time: 'Il y a 6 heures',
            icon: '🔒',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000)
          }
        );
      }

      // Trier toutes les activités par date (plus récente en premier)
      this.recentActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Limiter à 8 activités maximum
      this.recentActivities = this.recentActivities.slice(0, 8);

      console.log('✅ Activités récentes chargées:', this.recentActivities);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des activités récentes:', error);
      // Utiliser des activités par défaut en cas d'erreur
      this.recentActivities = [
        {
          type: 'system',
          message: 'Tableau de bord administrateur initialisé',
          time: 'Maintenant',
          icon: '🚀',
          date: new Date()
        }
      ];
    } finally {
      this.isLoadingActivities = false;
    }
  }

  /**
   * Obtient le type d'activité en fonction de l'état de la réclamation
   */
  private getReclamationActivityType(etat: string): string {
    switch (etat) {
      case 'EN_ATTENTE': return 'reclamation-pending';
      case 'EN_COURS': return 'reclamation-progress';
      case 'TRAITEE': return 'reclamation-resolved';
      case 'REJETEE': return 'reclamation-rejected';
      default: return 'reclamation';
    }
  }

  /**
   * Obtient l'icône en fonction de l'état de la réclamation
   */
  private getReclamationIcon(etat: string): string {
    switch (etat) {
      case 'EN_ATTENTE': return '⏳';
      case 'EN_COURS': return '🔄';
      case 'TRAITEE': return '✅';
      case 'REJETEE': return '❌';
      default: return '📋';
    }
  }

  /**
   * Obtient le label du rôle utilisateur
   */
  private getUserRoleLabel(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN': return 'administrateur';
      case 'ROLE_AGENT': return 'agent';
      case 'ROLE_CLIENT': return 'client';
      default: return 'utilisateur';
    }
  }

  /**
   * Obtient l'icône en fonction du rôle utilisateur
   */
  private getUserIcon(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN': return '👑';
      case 'ROLE_AGENT': return '👨‍💼';
      case 'ROLE_CLIENT': return '👤';
      default: return '👥';
    }
  }

  /**
   * Calcule le temps relatif par rapport à maintenant
   */
  private getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Il y a quelques secondes';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
  }

  /**
   * TrackBy function pour optimiser les performances de la liste d'activités
   */
  trackByActivityTime(index: number, activity: any): string {
    return activity.time + activity.message;
  }

}
