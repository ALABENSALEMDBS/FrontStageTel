import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GestionuserService } from '../../services/gestionUserSerice/gestionuser.service';
import { UserStateService } from '../../services/user-state.service';

@Component({
  selector: 'app-clientdashboard',
  imports: [NgFor, NgIf],
  templateUrl: './clientdashboard.component.html',
  styleUrl: './clientdashboard.component.css'
})
export class ClientdashboardComponent  implements OnInit {
  isDropdownOpen = false
  currentUser: any = null
  userNameFromUrl: string | null = null

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

  constructor(private router: Router, private route: ActivatedRoute, private gestionUserService: GestionuserService, private userStateService: UserStateService) {}

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
    // Navigate to account page
    console.log("Navigate to account")
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
}