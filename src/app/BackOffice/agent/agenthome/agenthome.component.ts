import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangePasswordRequest } from '../../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../../core/models/ChangePhoto';
import { GestionreclamationService } from '../../../services/gestionReclamationService/gestionreclamation.service';
import { GestionuserService } from '../../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../../services/notification.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-agenthome',
  imports: [NgFor, NgIf, ReactiveFormsModule, DatePipe, FormsModule],
  templateUrl: './agenthome.component.html',
  styleUrl: './agenthome.component.css'
})
export class AgenthomeComponent implements OnInit, OnDestroy {
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

  // Variables pour le modal de modification de photo
  isPhotoModalOpen = false;

  // Variables pour la mise à jour de la photo
  isUpdatingPhoto = false;

  // Variables pour le modal des réclamations agent
  isReclamationsModalOpen = false;
  reclamationsList: any[] = [];
  filteredReclamationsList: any[] = [];
  isLoadingReclamations = false;
  
  // Variables pour les filtres des réclamations agent
  filterIdRecl = '';
  filterEtatRecl = '';
  filterEmailClient = '';
  
  // Variables pour le modal de réponse aux réclamations
  isResponseModalOpen = false;
  selectedReclamationForResponse: any = null;
  responseForm: FormGroup;
  isSubmittingResponse = false;
  
  // Variables pour le modal de statistiques agent
  isAgentStatsModalOpen = false;
  agentStatsData: any = {
    totalReclamations: 0,
    enAttente: 0,
    enCours: 0,
    traitees: 0,
    rejetees: 0,
    parType: [],
    evolutionMensuelle: []
  };
  isLoadingAgentStats = false;
  
  // Options pour les filtres des réclamations agent
  etatReclOptions = [
    { value: '', label: 'Tous les états' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'TRAITEE', label: 'Traitée' },
    { value: 'REJETEE', label: 'Rejetée' }
  ];

  // Date actuelle pour l'affichage
  currentDate = new Date().toLocaleDateString('fr-FR');

  // Statistiques agent (mise à jour avec vraies données)
  agentStats = {
    totalReclamations: 0,
    reclamationsEnCours: 0,
    reclamationsResolues: 0,
    reclamationsEnAttente: 0,
    totalRenseignements: 67,
    renseignementsEnCours: 8,
    renseignementsResolus: 59,
    tauxResolution: '92%',
    tempsResponseMoyen: '2.5h'
  };

  // Propriété calculée pour récupérer les réclamations récentes (les 3 dernières)
  get recentReclamations(): any[] {
    return this.reclamationsList
      .sort((a, b) => new Date(b.dateRecl).getTime() - new Date(a.dateRecl).getTime())
      .slice(0, 5)
      .map(reclamation => ({
        id: reclamation.idRecl,
        client: reclamation.utilisateurRecl ? 
          `${reclamation.utilisateurRecl.prenomUser} ${reclamation.utilisateurRecl.nomUser}` : 
          'Client inconnu',
        type: this.getTypeReclLabel(reclamation.typeRecl),
        statut: this.getEtatReclLabel(reclamation.etatRecl),
        priorite: this.calculatePriority(reclamation.etatRecl),
        dateCreation: this.formatDate(reclamation.dateRecl),
        description: reclamation.descriptionRecl,
        etatRecl: reclamation.etatRecl,
        statutColor: this.getStatutColor(reclamation.etatRecl)
      }));
  }

  // Méthode pour obtenir la couleur du statut
  getStatutColor(etat: string): string {
    switch (etat) {
      case 'REJETEE': return '#dc3545'; // Rouge
      case 'TRAITEE': return '#28a745'; // Vert
      case 'EN_COURS': return '#007bff'; // Bleu
      case 'EN_ATTENTE': return '#fd7e14'; // Orange
      default: return '#fd7e14'; // Orange par défaut
    }
  }

  // Méthode pour calculer la priorité basée sur l'état
  calculatePriority(etat: string): string {
    switch (etat) {
      case 'EN_ATTENTE': return 'Haute';
      case 'EN_COURS': return 'Moyenne';
      case 'TRAITEE': return 'Basse';
      case 'REJETEE': return 'Basse';
      default: return 'Moyenne';
    }
  }

  // Renseignements récents (exemple)
  recentRenseignements = [
    {
      id: 'REN001',
      client: 'Salma Bouaziz',
      type: 'Tarifs ADSL',
      statut: 'En cours',
      dateCreation: '2025-01-20',
      question: 'Quels sont les tarifs pour ADSL 20 Mbps?'
    },
    {
      id: 'REN002',
      client: 'Karim Sassi',
      type: 'Couverture réseau',
      statut: 'Nouveau',
      dateCreation: '2025-01-20',
      question: 'Est-ce que la fibre est disponible dans ma région?'
    },
    {
      id: 'REN003',
      client: 'Amina Gharbi',
      type: 'Services mobiles',
      statut: 'Résolu',
      dateCreation: '2025-01-19',
      question: 'Comment activer le roaming international?'
    }
  ];

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

    // Initialiser le formulaire de réponse aux réclamations
    this.responseForm = this.fb.group({
      descriptionReponRecl: ['', [Validators.required, Validators.minLength(10)]]
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
    // Récupérer les données de l'utilisateur connecté
    this.currentUser = this.gestionUserService.getCurrentUser();
    
    // S'abonner aux changements d'état de l'utilisateur
    this.userStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Vérifier si l'utilisateur est connecté et a le rôle agent
    if (!this.gestionUserService.isAuthenticated() || !this.currentUser) {
      this.router.navigate(['/login']);
    } else if (this.currentUser.role !== 'ROLE_AGENT') {
      this.router.navigate(['/login']);
    }

    // Charger les réclamations réelles
    this.loadReclamations();
  }

  /**
   * Charge toutes les réclamations pour l'agent
   */
  loadReclamations(): void {
    this.gestionReclamationService.getAllReclamations().subscribe({
      next: (data) => {
        this.reclamationsList = data || [];
        // Mettre à jour les statistiques avec les vraies données
        this.updateStatsFromRealData();
        console.log("✅ Réclamations chargées pour l'agent:", this.reclamationsList);
      },
      error: (error) => {
        console.error("❌ Erreur lors du chargement des réclamations:", error);
        this.reclamationsList = [];
        this.notificationService.showError('Erreur lors du chargement des réclamations', 4000);
      }
    });
  }

  /**
   * Met à jour les statistiques avec les vraies données
   */
  updateStatsFromRealData(): void {
    const total = this.reclamationsList.length;
    const enCours = this.reclamationsList.filter(r => r.etatRecl === 'EN_COURS').length;
    const resolues = this.reclamationsList.filter(r => r.etatRecl === 'TRAITEE').length;
    const enAttente = this.reclamationsList.filter(r => r.etatRecl === 'EN_ATTENTE').length;

    this.agentStats = {
      ...this.agentStats,
      totalReclamations: total,
      reclamationsEnCours: enCours, // En cours
      reclamationsResolues: resolues,
      reclamationsEnAttente: enAttente, // En attente
    };
  }

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
    if (!target.closest('.mobile-menu-toggle') && !target.closest('.agent-nav')) {
      this.isMobileMenuOpen = false;
    }
  }

  navigateToAccount() {
    this.isDropdownOpen = false;
    this.isUserInfoModalOpen = true;
    // Fermer les autres modals s'ils sont ouverts
    this.isChangePasswordModalOpen = false;
    this.isPhotoModalOpen = false;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("Modal informations agent ouvert");
  }

  logout() {
    this.isDropdownOpen = false;
    this.gestionUserService.logout();
    console.log("Agent logged out");
  }

  // Gestion d'erreur d'image pour avatar par défaut
  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMyOGE3NDUiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM3MyIDQgNC41IDcuNVM5LjUgMTIgMTIgMTJaTTEyIDEzLjVjLTMgMC04IDEuNS04IDQuNXYyaDEydi0yYzAtM3MtNS00LjUtOC00LjVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+';
  }

  // Méthodes pour le modal de changement de mot de passe
  openChangePasswordModal() {
    this.isChangePasswordModalOpen = true;
    this.changePasswordForm.reset();
    // Fermer le dropdown si ouvert
    this.isDropdownOpen = false;
    // Fermer les autres modals s'ils sont ouverts
    this.isUserInfoModalOpen = false;
    this.isPhotoModalOpen = false;
    // Bloquer le scroll de la page
    document.body.style.overflow = 'hidden';
    console.log("Modal changement mot de passe ouvert pour l'agent");
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

  closeChangePasswordModal() {
    this.isChangePasswordModalOpen = false;
    this.changePasswordForm.reset();
    this.showOldPassword = false;
    this.showNewPassword = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
  }

  closePhotoModal() {
    this.isPhotoModalOpen = false;
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
    console.log("Modal photo fermé pour l'agent");
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

      console.log("🔐 Changement de mot de passe agent en cours...");
      
      this.gestionUserService.changePassword(changePasswordRequest).subscribe({
        next: (response) => {
          console.log("✅ Mot de passe agent changé avec succès:", response);
          this.isChangingPassword = false;
          
          // Afficher une notification de succès
          this.notificationService.showSuccess('Mot de passe changé avec succès !', 4000);
          
          // Fermer le modal
          this.closeChangePasswordModal();
        },
        error: (error) => {
          console.error("❌ Erreur lors du changement de mot de passe agent:", error);
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

  // Méthodes pour la gestion de l'upload de photo de profil
  
  // Méthode pour ouvrir le sélecteur de fichier
  onProfilePhotoClick() {
    if (this.isUpdatingPhoto) return;
    
    console.log("🖼️ Clic sur la photo de profil agent - Ouverture du sélecteur de fichier");
    
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
        
        console.log("🔄 Mise à jour de la photo agent:", changePhoto);
        
        this.gestionUserService.updatePhoto(this.currentUser.idUser, changePhoto).subscribe({
          next: (response) => {
            console.log("✅ Photo agent mise à jour avec succès:", response);
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
            console.error("❌ Erreur lors de la mise à jour de la photo agent:", error);
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
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen || this.isPhotoModalOpen || this.isReclamationsModalOpen) {
      document.body.style.overflow = 'auto';
    }
  }

  // Méthodes pour le modal des réclamations agent
  openReclamationsModal() {
    this.isReclamationsModalOpen = true;
    document.body.style.overflow = 'hidden';
    this.loadAllReclamationsForModal();
    console.log("Modal réclamations agent ouvert");
  }

  closeReclamationsModal() {
    this.isReclamationsModalOpen = false;
    document.body.style.overflow = 'auto';
    // Réinitialiser les filtres
    this.filterIdRecl = '';
    this.filterEtatRecl = '';
    this.filterEmailClient = '';
    console.log("Modal réclamations agent fermé");
  }

  loadAllReclamationsForModal() {
    this.isLoadingReclamations = true;
    console.log("📋 Chargement de toutes les réclamations pour l'agent...");

    this.gestionReclamationService.getAllReclamations().subscribe({
      next: (response: any) => {
        console.log("✅ Réclamations chargées pour le modal agent:", response);
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
    
    console.log("🔍 Filtres appliqués sur les réclamations agent:", {
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

  // Méthodes de navigation agent
  navigateToReclamations() {
    console.log("Ouverture du modal des réclamations agent");
    this.openReclamationsModal();
    this.closeMobileMenu();
  }

  navigateToRenseignements() {
    console.log("Navigation vers gestion renseignements");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  navigateToReports() {
    this.closeMobileMenu();
    this.openAgentStatsModal();
  }

  navigateToSettings() {
    console.log("Navigation vers paramètres");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  // Méthodes pour la gestion des réclamations
  viewReclamation(reclamation: any) {
    console.log("Consultation de la réclamation:", reclamation);
    // Pré-remplir le filtre avec l'ID de la réclamation sélectionnée
    this.filterIdRecl = reclamation.id.toString();
    // Réinitialiser les autres filtres
    this.filterEtatRecl = '';
    this.filterEmailClient = '';
    // Ouvrir le modal
    this.openReclamationsModal();
  }

  respondToReclamation(reclamation: any) {
    this.selectedReclamationForResponse = reclamation;
    this.responseForm.reset();
    this.isResponseModalOpen = true;
    
    // Mettre immédiatement la réclamation en cours même si l'agent n'écrit pas de réponse
    this.mettreReclamationEnCours(reclamation);
  }

  // Méthode pour mettre une réclamation en cours
  mettreReclamationEnCours(reclamation: any) {
    const reclamationId = reclamation.idRecl || reclamation.id;
    
    this.gestionReclamationService.mettreEnCours(reclamationId).subscribe({
      next: (response) => {
        console.log('Réclamation mise en cours:', response);
        // Mettre à jour l'état local de la réclamation
        const index = this.reclamationsList.findIndex(r => r.idRecl === reclamationId);
        if (index !== -1) {
          this.reclamationsList[index].etatRecl = 'EN_COURS';
          this.applyReclamationsFilters();
        }
        this.notificationService.showSuccess('Réclamation mise en cours avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de la mise en cours:', error);
        this.notificationService.showError('Erreur lors de la mise en cours de la réclamation');
      }
    });
  }

  // Fermer le modal de réponse
  closeResponseModal() {
    this.isResponseModalOpen = false;
    this.selectedReclamationForResponse = null;
    this.responseForm.reset();
    this.isSubmittingResponse = false;
  }

  // Soumettre la réponse
  onSubmitResponse() {
    if (this.responseForm.invalid || !this.selectedReclamationForResponse) {
      return;
    }

    this.isSubmittingResponse = true;
    
    // Créer l'objet réclamation avec la réponse
    const reclamationToUpdate = {
      ...this.selectedReclamationForResponse,
      descriptionReponRecl: this.responseForm.get('descriptionReponRecl')?.value,
      dateReponRecl: new Date(),
      etatRecl: 'TRAITEE'
    };

    const reclamationId = this.selectedReclamationForResponse.idRecl || this.selectedReclamationForResponse.id;

    this.gestionReclamationService.repondreReclamation(reclamationId, reclamationToUpdate).subscribe({
      next: (response) => {
        console.log('Réponse envoyée:', response);
        // Mettre à jour l'état local de la réclamation
        const index = this.reclamationsList.findIndex(r => r.idRecl === reclamationId);
        if (index !== -1) {
          this.reclamationsList[index] = response;
          this.applyReclamationsFilters();
        }
        this.notificationService.showSuccess('Réponse envoyée avec succès');
        this.closeResponseModal();
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi de la réponse:', error);
        this.notificationService.showError('Erreur lors de l\'envoi de la réponse');
        this.isSubmittingResponse = false;
      }
    });
  }

  // Méthodes pour la gestion des renseignements
  viewRenseignement(renseignement: any) {
    console.log("Consulter renseignement:", renseignement);
    // Implémenter l'affichage détaillé du renseignement
  }

  respondToRenseignement(renseignement: any) {
    console.log("Répondre au renseignement:", renseignement);
    // Implémenter la réponse au renseignement
  }

  // Méthodes utilitaires
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'rejetée':
      case 'rejetee': 
        return '#dc3545'; // Rouge
      case 'traitée':
      case 'traitee':
      case 'résolu': 
        return '#28a745'; // Vert
      case 'en cours': 
        return '#007bff'; // Bleu
      case 'en attente':
      case 'nouveau': 
        return '#fd7e14'; // Orange
      default: 
        return '#fd7e14'; // Orange par défaut
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'haute': return '#dc3545';
      case 'moyenne': return '#ffc107';
      case 'basse': return '#28a745';
      default: return '#6c757d';
    }
  }

  // Méthodes pour le modal de statistiques agent
  openAgentStatsModal() {
    this.isAgentStatsModalOpen = true;
    this.loadAgentStatistics();
  }

  closeAgentStatsModal() {
    this.isAgentStatsModalOpen = false;
  }

  loadAgentStatistics() {
    this.isLoadingAgentStats = true;
    
    this.gestionReclamationService.getAllReclamations().subscribe({
      next: (reclamations) => {
        this.calculateAgentStatistics(reclamations);
        this.isLoadingAgentStats = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques agent:', error);
        this.notificationService.showError('Erreur lors du chargement des statistiques');
        this.isLoadingAgentStats = false;
      }
    });
  }

  calculateAgentStatistics(reclamations: any[]) {
    // Statistiques globales
    this.agentStatsData.totalReclamations = reclamations.length;
    this.agentStatsData.enAttente = reclamations.filter(r => r.etatRecl === 'EN_ATTENTE').length;
    this.agentStatsData.enCours = reclamations.filter(r => r.etatRecl === 'EN_COURS').length;
    this.agentStatsData.traitees = reclamations.filter(r => r.etatRecl === 'TRAITEE').length;
    this.agentStatsData.rejetees = reclamations.filter(r => r.etatRecl === 'REJETEE').length;

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
    
    this.agentStatsData.parType = Array.from(typeStats.values())
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
    
    this.agentStatsData.evolutionMensuelle = evolutionData;

    console.log('📊 Statistiques agent calculées:', this.agentStatsData);
  }

  // Méthode pour générer le gradient du graphique circulaire
  getPieChartGradient(): string {
    const total = this.agentStatsData.totalReclamations;
    if (total === 0) return 'conic-gradient(#e9ecef 0deg 360deg)';

    const enAttente = this.agentStatsData.enAttente;
    const enCours = this.agentStatsData.enCours;
    const traitees = this.agentStatsData.traitees;
    const rejetees = this.agentStatsData.rejetees;

    // Calculer les angles pour chaque segment
    const enAttenteAngle = (enAttente / total) * 360;
    const enCoursAngle = enAttenteAngle + (enCours / total) * 360;
    const traiteesAngle = enCoursAngle + (traitees / total) * 360;
    const rejeteesAngle = traiteesAngle + (rejetees / total) * 360;

    let gradient = 'conic-gradient(';
    let currentAngle = 0;

    if (enAttente > 0) {
      gradient += `#ffc107 ${currentAngle}deg ${enAttenteAngle}deg`;
      currentAngle = enAttenteAngle;
      if (currentAngle < 360) gradient += ', ';
    }

    if (enCours > 0) {
      gradient += `#17a2b8 ${currentAngle}deg ${enCoursAngle}deg`;
      currentAngle = enCoursAngle;
      if (currentAngle < 360) gradient += ', ';
    }

    if (traitees > 0) {
      gradient += `#28a745 ${currentAngle}deg ${traiteesAngle}deg`;
      currentAngle = traiteesAngle;
      if (currentAngle < 360) gradient += ', ';
    }

    if (rejetees > 0) {
      gradient += `#dc3545 ${currentAngle}deg ${rejeteesAngle}deg`;
    }

    gradient += ')';
    return gradient;
  }

}
