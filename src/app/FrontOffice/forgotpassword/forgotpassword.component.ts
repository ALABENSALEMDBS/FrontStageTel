import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  constructor(
    private router: Router,
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
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      console.log("Password reset request:", this.forgotPasswordForm.value)
      this.isSubmitted = true
      // Implement password reset logic here
    }
  }

  onVerifyCode() {
    if (this.verificationForm.valid) {
      console.log("Verification attempt:", this.verificationForm.value)
      
      // Vérifier si l'email de confirmation correspond à l'email initial
      const originalEmail = this.forgotPasswordForm.get('email')?.value
      const confirmEmail = this.verificationForm.get('confirmEmail')?.value
      
      if (originalEmail !== confirmEmail) {
        // Afficher une erreur si les emails ne correspondent pas
        this.verificationForm.get('confirmEmail')?.setErrors({ emailMismatch: true })
        return
      }
      
      // Ici vous pouvez implémenter la logique de vérification du code
      // Par exemple, rediriger vers une page de réinitialisation du mot de passe
      console.log("Code verified successfully!")
      this.router.navigate(['/reset-password']) // ou vers votre page de reset
    }
  }

 

 
}

