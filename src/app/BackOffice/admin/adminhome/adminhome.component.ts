import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangePasswordRequest } from '../../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../../core/models/ChangePhoto';
import { Utilisateur } from '../../../../core/models/Utilisateur';
import { GestionreclamationService } from '../../../services/gestionReclamationService/gestionreclamation.service';
import { GestionuserService } from '../../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../../services/notification.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-adminhome',
  imports: [NgFor, NgIf, ReactiveFormsModule, FormsModule],
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
    private userStateService: UserStateService,
    private notificationService: NotificationService
  ) {
    // Initialiser le formulaire de changement de mot de passe
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
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
  }



   /**
   * Charge tous les clients depuis le service
   */
 fetchClients(): void {
  // appel vers l'API pour récupérer les clients
  this.gestionUserService.getAllClients().subscribe(data => {
    this.clients = data;
   this.adminStats.totalClient = this.clients.length;
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
  });
}

   // Statistiques admin (exemple)
  adminStats = {
    totalClient: 0,
    totalreclamation: 0,
    totalAgent: 0,
    Renseignement: 1180
  };

  // Activités récentes (exemple)
  recentActivities = [
    {
      type: 'user',
      message: 'Nouvel utilisateur inscrit: Ahmed Ben Ali',
      time: 'Il y a 5 minutes',
      icon: '👤'
    },
    {
      type: 'service',
      message: 'Service IPTV activé pour 15 nouveaux clients',
      time: 'Il y a 30 minutes',
      icon: '📺'
    },
    {
      type: 'payment',
      message: 'Paiement reçu: 150 DT - Client #1234',
      time: 'Il y a 1 heure',
      icon: '💳'
    },
    {
      type: 'system',
      message: 'Maintenance système programmée pour demain',
      time: 'Il y a 2 heures',
      icon: '⚙️'
    }
  ];


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
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen || this.isReclamationsModalOpen) {
      document.body.style.overflow = 'auto';
    }
  }

  // Méthodes de navigation admin
  navigateToUserManagement() {
    console.log("Navigation vers gestion utilisateurs");
    this.router.navigate(['/admin/user-management']);
  }

  navigateToServiceManagement() {
    console.log("Navigation vers gestion services");
    // Implémenter la navigation
  }

  navigateToReports() {
    console.log("Navigation vers rapports");
    // Implémenter la navigation
  }

  navigateToSettings() {
    console.log("Navigation vers paramètres");
    // Implémenter la navigation
  }

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

}
