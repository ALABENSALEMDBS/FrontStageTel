import { NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, map, Observable, of, switchMap } from 'rxjs';
import { Utilisateur } from '../../../core/models/Utilisateur';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-signup',
  imports: [RouterLink, ReactiveFormsModule, NgIf],
  templateUrl: './signup.component.html',
  standalone: true,
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnDestroy {

  signupForm: FormGroup
  showPassword = false
  showVerifPassword = false
  selectedFile: File | null = null
  selectedContractFile: File | null = null
  photoPreview: string | null = null
  contractPreview: string | null = null
  isSubmitting = false
  
  // Limite de taille des fichiers en bytes (5MB)
  readonly MAX_FILE_SIZE = 3 * 1024 * 1024; // 5MB

  constructor(
    private router: Router,
    private gestionuserService: GestionuserService,
    private notificationService: NotificationService
  ) {
    this.signupForm = new FormGroup({
      nomUser: new FormControl("", [Validators.required, Validators.minLength(2)]),
      prenomUser: new FormControl("", [Validators.required, Validators.minLength(2)]),
      emailUser: new FormControl("", 
        [Validators.required, Validators.email, this.emailDomainValidator],
        [this.emailExistsValidator()]
      ),
      passwordUser: new FormControl("", [Validators.required, Validators.minLength(8)]),
      verifpassword: new FormControl("", [Validators.required]),
      numeroLigne: new FormControl("", [Validators.required, Validators.pattern(/^\d{8}$/)]),
      photoUser: new FormControl("", []),
      documentContrat: new FormControl("", [Validators.required]),
    }, { validators: this.passwordMatchValidator })
  }

  // Validateur personnalisé pour vérifier que l'email contient un point dans le domaine
  emailDomainValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) {
      return null; // Si l'email est vide, laissons le validateur required gérer ça
    }
    
    // Vérifier que l'email contient @ et au moins un point après le @
    const emailParts = email.split('@');
    if (emailParts.length !== 2) {
      return { invalidEmailFormat: true };
    }
    
    const domain = emailParts[1];
    if (!domain || !domain.includes('.')) {
      return { noDotInDomain: true };
    }
    
    // Vérifier que le domaine a au moins un caractère avant et après le point
    const domainParts = domain.split('.');
    if (domainParts.some((part: string) => part.length === 0)) {
      return { invalidDomainFormat: true };
    }
    
    return null; // Email valide
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get("passwordUser")
    const confirmPassword = form.get("verifpassword")

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }

    return null
  }

  /**
   * Validateur asynchrone pour vérifier si l'email existe déjà
   * @returns AsyncValidatorFn
   */
  emailExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.trim() === '') {
        return of(null);
      }

      // Débounce pour éviter trop d'appels à l'API
      return of(control.value).pipe(
        debounceTime(500), // Attendre 500ms après que l'utilisateur ait arrêté de taper
        switchMap((email: string) => 
          this.gestionuserService.checkEmailExists(email).pipe(
            map((exists: boolean) => exists ? { emailExists: true } : null),
            catchError(() => of(null)) // En cas d'erreur, on considère que l'email n'existe pas
          )
        )
      );
    };
  }



  onFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      // Vérifier la taille du fichier
      if (file.size > this.MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        this.notificationService.showError(`La photo est trop volumineuse (${fileSizeMB}MB). Taille maximale autorisée: ${maxSizeMB}MB`, 5000);
        return;
      }
      
      this.selectedFile = file
      
      // Stocker temporairement le nom du fichier dans le formulaire
      this.signupForm.patchValue({ photoUser: file.name })
      
      console.log('Photo sélectionnée:', file.name, `(${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      
      // Créer un aperçu de l'image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.photoPreview = e.target?.result as string
        }
        reader.readAsDataURL(file)
      }
    }
  }

  onContractFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      // Vérifier la taille du fichier
      if (file.size > this.MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (this.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        this.notificationService.showError(`Le document est trop volumineux (${fileSizeMB}MB). Taille maximale autorisée: ${maxSizeMB}MB`, 5000);
        return;
      }
      
      this.selectedContractFile = file
      
      // Stocker temporairement le nom du fichier dans le formulaire
      this.signupForm.patchValue({ documentContrat: file.name })
      
      console.log('Document sélectionné:', file.name, `(${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      
      // Créer un aperçu du document
      if (file.type.startsWith('image/')) {
        // Pour les images
        const reader = new FileReader()
        reader.onload = (e) => {
          this.contractPreview = e.target?.result as string
        }
        reader.readAsDataURL(file)
      } else if (file.type === 'application/pdf') {
        // Pour les PDF, créer une URL d'objet
        this.contractPreview = URL.createObjectURL(file)
      }
    }
  }

  onSubmit() {
    if (this.signupForm.valid) {
      // Activer l'état de chargement
      this.isSubmitting = true;
      
      // Générer les URLs des fichiers sans upload
      this.generateFileUrlsAndRegister();
    } else {
      // Formulaire invalide - marquer tous les champs comme touchés
      this.markAllFieldsAsTouched();
    }
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs
   */
  private markAllFieldsAsTouched() {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Génère les URLs des fichiers sans upload et procède à l'inscription
   */
  private async generateFileUrlsAndRegister() {
    try {
      // Uploader le document de contrat si il existe
      if (this.selectedContractFile) {
        console.log('Upload du document en cours:', this.selectedContractFile.name);
        await this.uploadFile(this.selectedContractFile);
        const contractUrl = `http://localhost/document/${this.selectedContractFile.name}`;
        this.signupForm.patchValue({ documentContrat: contractUrl });
        console.log('Document URL générée après upload:', contractUrl);
      }
      
      // Uploader la photo utilisateur si elle existe
      if (this.selectedFile) {
        console.log('Upload de la photo en cours:', this.selectedFile.name);
        await this.uploadFile(this.selectedFile);
        const photoUrl = `http://localhost/document/${this.selectedFile.name}`;
        this.signupForm.patchValue({ photoUser: photoUrl });
        console.log('Photo URL générée après upload:', photoUrl);
      }
      
      console.log('URLs générées, valeurs du formulaire:', this.signupForm.value);
      
      // Procéder à l'inscription avec les URLs générées
      this.proceedWithRegistration();
      
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      this.isSubmitting = false;
      this.notificationService.showError('Erreur lors de l\'upload des fichiers. Veuillez réessayer.', 10000);
    }
  }

  uploadError: string | null = null;
  uploadResponse: any;
  uploadFile(file: File): Promise<void> {
      return new Promise((resolve, reject) => {
          this.uploadError = null;
          this.gestionuserService.uploadFile(file).subscribe({
              next: (response) => {
                  console.log('Upload successful:', response);
                  resolve();
              },
              error: (error) => {
                  this.uploadError = 'Upload failed: ' + error.message;
                  console.error('Upload error:', error);
                  reject(error);
              }
          });
      });
  }

  /**
   * Procède à l'inscription après l'upload des fichiers
   */
  private proceedWithRegistration() {
    // Créer l'objet de requête en utilisant le service
    const registrationRequest = this.gestionuserService.createRegistrationRequest(this.signupForm.value);
    
    // Appeler le service pour l'inscription
    this.gestionuserService.registerUser(registrationRequest).subscribe({
      next: (utilisateur: Utilisateur) => {
        // Succès de l'inscription
        console.log('Inscription réussie:', utilisateur);
        this.isSubmitting = false;
        
        // Afficher la notification de succès globale pendant 10 secondes
        this.notificationService.showSuccess(
          'Inscription réussie ! Redirection vers la connexion...', 
          10000
        );
        
        // Rediriger vers login après 1 seconde
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error: any) => {
        // Erreur lors de l'inscription
        console.error('Erreur lors de l\'inscription:', error);
        this.isSubmitting = false;
        
        // Afficher la notification d'erreur globale
        let errorMessage = 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
        
        // Gérer les différents types d'erreurs
        if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
        } else if (error.status === 409) {
          errorMessage = 'Cet email est déjà utilisé. Veuillez choisir un autre email.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard.';
        }
        
        this.notificationService.showError(errorMessage, 10000);
      }
    });
  }

  /**
   * Génère un nom de fichier unique en ajoutant un timestamp
   * @param originalFileName - Le nom original du fichier
   * @returns Le nom de fichier unique
   */
  private generateUniqueFileName(originalFileName: string): string {
    const timestamp = new Date().getTime();
    const fileExtension = originalFileName.split('.').pop();
    const nameWithoutExtension = originalFileName.split('.').slice(0, -1).join('.');
    return `${nameWithoutExtension}_${timestamp}.${fileExtension}`;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  toggleVerifPasswordVisibility() {
    this.showVerifPassword = !this.showVerifPassword
  }

  isImageFile(file: File | null): boolean {
    return file ? file.type.startsWith('image/') : false
  }

  isPdfFile(file: File | null): boolean {
    return file ? file.type === 'application/pdf' : false
  }

  ngOnDestroy() {
    // Nettoyer les URLs d'objet pour éviter les fuites mémoire
    if (this.contractPreview && this.isPdfFile(this.selectedContractFile)) {
      URL.revokeObjectURL(this.contractPreview)
    }
  }

}
