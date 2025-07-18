import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgotpassword',
  imports: [ReactiveFormsModule,NgIf, RouterLink],
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.css'
})
export class ForgotpasswordComponent {
  forgotPasswordForm: FormGroup
  verificationForm: FormGroup
  isSubmitted = false
  isLoading = false
  showVerifPassword = false
  showVerifPasswordNOUVEAU = false


  constructor(
    private router: Router,
    private gestionuserService: GestionuserService,
    private notificationService: NotificationService
  ) {
    this.forgotPasswordForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.email]),
    });

    this.verificationForm = new FormGroup({
      verificationCode: new FormControl("", [
        Validators.required, 
        Validators.pattern(/^\d{6}$/)
      ]),
      confirmEmail: new FormControl("", [
        Validators.required, 
        Validators.email
      ]),
      newPassword: new FormControl("", [
        Validators.required,
        Validators.minLength(8)
      ]),
      confirmPassword: new FormControl("", [Validators.required])
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      const email = this.forgotPasswordForm.get('email')?.value;
      
      this.gestionuserService.sendResetCode(email).subscribe({
        next: (response) => {
          console.log('Code envoyé:', response);
          this.isSubmitted = true;
          this.isLoading = false;
          
          // Pré-remplir l'email de confirmation
          this.verificationForm.patchValue({ confirmEmail: email });
          
          this.notificationService.showSuccess('Code de vérification envoyé par email !', 5000);
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi du code:', error);
          this.isLoading = false;
          
          let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
          if (error.status === 400) {
            errorMessage = error.error || 'Email invalide ou introuvable.';
          }
          
          this.notificationService.showError(errorMessage, 5000);
        }
      });
    }
  }

  onChangePassword() {
    if (this.verificationForm.valid) {
      // Vérifier si l'email de confirmation correspond à l'email initial
      const originalEmail = this.forgotPasswordForm.get('email')?.value;
      const confirmEmail = this.verificationForm.get('confirmEmail')?.value;
      
      if (originalEmail !== confirmEmail) {
        this.verificationForm.get('confirmEmail')?.setErrors({ emailMismatch: true });
        this.notificationService.showError('L\'email de confirmation ne correspond pas.', 5000);
        return;
      }
      
      this.isLoading = true;
      
      const email = this.forgotPasswordForm.get('email')?.value;
      const code = this.verificationForm.get('verificationCode')?.value;
      const newPassword = this.verificationForm.get('newPassword')?.value;
      
      this.gestionuserService.resetPassword(email, code, newPassword).subscribe({
        next: (response) => {
          console.log('Mot de passe réinitialisé:', response);
          this.isLoading = false;
          
          this.notificationService.showSuccess('Mot de passe réinitialisé avec succès !', 5000);
          
          // Rediriger vers la page de connexion après 2 secondes
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur lors de la réinitialisation:', error);
          this.isLoading = false;
          
          let errorMessage = 'Une erreur s\'est produite. Veuillez réessayer.';
          if (error.status === 400) {
            errorMessage = error.error || 'Code invalide ou expiré.';
          }
          
          this.notificationService.showError(errorMessage, 5000);
        }
      });
    }
  }


    toggleVerifPasswordVisibility() {
    this.showVerifPassword = !this.showVerifPassword
  }
  toggleVerifPasswordVisibilityNOUVEAU() {
    this.showVerifPasswordNOUVEAU = !this.showVerifPasswordNOUVEAU
  }
}

