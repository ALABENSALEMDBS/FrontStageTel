import { NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  constructor(
    private router: Router,
  ) {
    this.signupForm = new FormGroup({
      nomUser: new FormControl("", [Validators.required, Validators.minLength(2)]),
      prenomUser: new FormControl("", [Validators.required, Validators.minLength(2)]),
      emailUser: new FormControl("", [Validators.required, Validators.email, this.emailDomainValidator]),
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



  onFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      this.selectedFile = file
      this.signupForm.patchValue({ photoUser: file.name })
      
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
      this.selectedContractFile = file
      this.signupForm.patchValue({ documentContrat: file.name })
      
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
      console.log("Signup attempt:", this.signupForm.value)
      console.log("Selected photo:", this.selectedFile)
      console.log("Selected contract document:", this.selectedContractFile)
      // Implement signup logic here
    }
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
