import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangePasswordRequest } from '../../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../../core/models/ChangePhoto';
import { GestionuserService } from '../../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../../services/notification.service';
import { UserStateService } from '../../../services/user-state.service';

@Component({
  selector: 'app-agenthome',
  imports: [NgFor, NgIf, ReactiveFormsModule, DatePipe],
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

  // Date actuelle pour l'affichage
  currentDate = new Date().toLocaleDateString('fr-FR');

  // Statistiques agent (exemple)
  agentStats = {
    totalReclamations: 45,
    reclamationsEnCours: 12,
    reclamationsResolues: 33,
    totalRenseignements: 67,
    renseignementsEnCours: 8,
    renseignementsResolus: 59,
    tauxResolution: '92%',
    tempsResponseMoyen: '2.5h'
  };

  // Réclamations récentes (exemple)
  recentReclamations = [
    {
      id: 'REC001',
      client: 'Ahmed Ben Ali',
      type: 'Problème de connexion',
      statut: 'En cours',
      priorite: 'Haute',
      dateCreation: '2025-01-20',
      description: 'Connexion internet instable depuis 3 jours'
    },
    {
      id: 'REC002',
      client: 'Fatma Trabelsi',
      type: 'Facturation',
      statut: 'Nouveau',
      priorite: 'Moyenne',
      dateCreation: '2025-01-20',
      description: 'Erreur sur la facture du mois dernier'
    },
    {
      id: 'REC003',
      client: 'Mohamed Khelifi',
      type: 'Service technique',
      statut: 'Résolu',
      priorite: 'Basse',
      dateCreation: '2025-01-19',
      description: 'Installation nouveau décodeur'
    }
  ];

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
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen || this.isPhotoModalOpen) {
      document.body.style.overflow = 'auto';
    }
  }

  // Méthodes de navigation agent
  navigateToReclamations() {
    console.log("Navigation vers gestion réclamations");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  navigateToRenseignements() {
    console.log("Navigation vers gestion renseignements");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  navigateToReports() {
    console.log("Navigation vers rapports");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  navigateToSettings() {
    console.log("Navigation vers paramètres");
    this.closeMobileMenu();
    // Implémenter la navigation
  }

  // Méthodes pour la gestion des réclamations
  viewReclamation(reclamation: any) {
    console.log("Consulter réclamation:", reclamation);
    // Implémenter l'affichage détaillé de la réclamation
  }

  respondToReclamation(reclamation: any) {
    console.log("Répondre à la réclamation:", reclamation);
    // Implémenter la réponse à la réclamation
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
      case 'nouveau': return '#17a2b8';
      case 'en cours': return '#ffc107';
      case 'résolu': return '#28a745';
      default: return '#6c757d';
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
}
