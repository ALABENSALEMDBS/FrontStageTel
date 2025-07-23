import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ChangePasswordRequest } from '../../../core/models/ChangePasswordRequest';
import { ChangePhoto } from '../../../core/models/ChangePhoto';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../services/notification.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-clientdashboard',
  imports: [NgFor, NgIf, ReactiveFormsModule],
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

  constructor(private router: Router, private route: ActivatedRoute, private fb: FormBuilder, private gestionUserService: GestionuserService, private userStateService: UserStateService, private notificationService: NotificationService) {
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
    // Récupérer le paramètre userName de l'URL
    this.userNameFromUrl = this.route.snapshot.params['userName'];
    console.log("🔗 Nom d'utilisateur depuis URL:", this.userNameFromUrl);
    
    // Récupérer les données de l'utilisateur connecté
    this.currentUser = this.gestionUserService.getCurrentUser();
    
    // S'abonner aux changements d'état de l'utilisateur
    this.userStateService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Vérifier si l'utilisateur est connecté
    if (!this.gestionUserService.isAuthenticated() || !this.currentUser) {
      this.router.navigate(['/login']);
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
    console.log("Open renseignement") 
    // Implement renseignement functionality
  }

  // Gestion d'erreur d'image pour avatar par défaut
  onImageError(event: any) {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2Yzc1N2QiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM3MyIDQgNC41IDcuNVM5LjUgMTIgMTIgMTJaTTEyIDEzLjVjLTMgMC04IDEuNS04IDQuNXYyaDEydi0yYzAtM3M1LTQuNS04LTQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
  }

  // Méthodes pour la gestion des documents
  isImageFile(url: string): boolean {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }

  isPdfFile(url: string): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('.pdf');
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
    if (this.isChangePasswordModalOpen || this.isUserInfoModalOpen) {
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
}