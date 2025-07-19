import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LoginRequest } from '../../../core/models/LoginRequest';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.css',

})
export class LoginComponent {

  loginForm: FormGroup
  showPassword = false
  isLoading = false

  constructor(
    private router: Router, 
    private gestionUserService: GestionuserService,
    private notificationService: NotificationService
  ) {
    this.loginForm = new FormGroup({
      emailUser: new FormControl("", [Validators.required, Validators.email, this.emailDomainValidator]),
      passwordUser: new FormControl("", [Validators.required, Validators.minLength(6)]),
    })
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

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const credentials: LoginRequest = this.loginForm.value;
      
      this.gestionUserService.login(credentials).subscribe({
        next: (response) => {
          console.log("Login successful:", response);
          this.isLoading = false;
          
          // Sauvegarder la session utilisateur
          this.gestionUserService.saveUserSession(response);
          
          this.notificationService.showSuccess('Connexion réussie !', 3000);
          
          // Rediriger selon le rôle
          setTimeout(() => {
            console.log("🔄 Redirection basée sur le rôle:", response.role);
            if (response.role === 'ROLE_ADMIN') {
              console.log("➡️ Redirection vers adminhome pour ADMIN");
              // Créer un nom d'utilisateur pour l'URL (prénom + nom)
              const userName = `${response.prenom}${response.nom}`;     // au lieu
              console.log("👤 Nom d'utilisateur pour URL:", userName); // au lieu
              this.router.navigate(['/adminhome', userName]);

            } else if (response.role === 'ROLE_CLIENT') {
              console.log("➡️ Redirection vers client-dashboard pour CLIENT");
              // Créer un nom d'utilisateur pour l'URL (prénom + nom)
              const userName = `${response.prenom}${response.nom}`;     // au lieu
              console.log("👤 Nom d'utilisateur pour URL:", userName); // au lieu
              this.router.navigate(['/client-dashboard', userName]);  //   au lieu
              //this.router.navigate(['/client-dashboard']);   // put ca

            } else if (response.role === 'ROLE_AGENT') {
              console.log("➡️ Redirection vers agenthome pour AGENT");
              // Créer un nom d'utilisateur pour l'URL (prénom + nom)
              const userName = `${response.prenom}${response.nom}`;     // au lieu
              console.log("👤 Nom d'utilisateur pour URL:", userName); // au lieu
              this.router.navigate(['/agenthome', userName]);  //   au lieu
              //this.router.navigate(['/client-dashboard']);   // put ca
            }
            
            else {
              console.log("⚠️ Rôle non reconnu, redirection vers home");
              this.router.navigate(['/home']);
            }
          }, 1000);
        },
        error: (error) => {
          console.error("Login error:", error);
          this.isLoading = false;
          
          let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
          if (error.status === 401) {
            errorMessage = 'Email ou mot de passe incorrect.';
          } else if (error.status === 400) {
            errorMessage = error.error || 'Données de connexion invalides.';
          }
          
          this.notificationService.showError(errorMessage, 5000);
        }
      });
    }
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('emailUser');
    if (emailControl?.errors) {
      if (emailControl.errors['required']) {
        return 'L\'email est requis';
      }
      if (emailControl.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (emailControl.errors['noDotInDomain']) {
        return 'Le domaine de l\'email doit contenir un point (ex: ala@esprit.tn)';
      }
      if (emailControl.errors['invalidDomainFormat']) {
        return 'Format de domaine invalide';
      }
      if (emailControl.errors['invalidEmailFormat']) {
        return 'Format d\'email invalide';
      }
    }
    return '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword
  }

  navigateToForgotPassword() {
    this.router.navigate(["/forgot-password"])
  }

  navigateToHome() {
    this.router.navigate(["/"])
  }
}
