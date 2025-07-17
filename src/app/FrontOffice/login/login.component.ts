import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  constructor(private router: Router) {
    this.loginForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email, this.emailDomainValidator]),
      password: new FormControl("", [Validators.required, Validators.minLength(6)]),
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
      console.log("Login attempt:", this.loginForm.value)
      // Implement login logic here
    }
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
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
