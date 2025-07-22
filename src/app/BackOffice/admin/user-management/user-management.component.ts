import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Utilisateur } from '../../../../core/models/Utilisateur';
import { GestionuserService } from '../../../services/gestionUserSerice/gestionuser.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-user-management',
  imports: [NgFor, NgIf, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  clients: Utilisateur[] = [];
  filteredClients: Utilisateur[] = [];
  filterForm: FormGroup;
  isLoading = false;
  
  // Variables pour le modal de confirmation
  isConfirmModalOpen = false;
  selectedClient: Utilisateur | null = null;
  isProcessing = false;
  
  // Variables pour le modal de contrat
  isContractModalOpen = false;
  selectedClientContract: Utilisateur | null = null;
  
  constructor(
    private gestionUserService: GestionuserService,
    private notificationService: NotificationService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      emailFilter: [''],
      numeroLigneFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadClients();
    this.setupFilters();
  }

  /**
   * Charge tous les clients depuis le service
   */
  loadClients(): void {
    this.isLoading = true;
    this.gestionUserService.getAllClients().subscribe({
      next: (clients) => {
        console.log('Clients chargés:', clients);
        this.clients = clients;
        this.filteredClients = clients;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
        this.notificationService.showError('Erreur lors du chargement des clients');
        this.isLoading = false;
      }
    });
  }

  /**
   * Configure les filtres en temps réel
   */
  setupFilters(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  /**
   * Applique les filtres sur la liste des clients
   */
  applyFilters(): void {
    const emailFilter = this.filterForm.get('emailFilter')?.value?.toLowerCase() || '';
    const numeroLigneFilter = this.filterForm.get('numeroLigneFilter')?.value || '';

    this.filteredClients = this.clients.filter(client => {
      const matchEmail = !emailFilter || client.emailUser?.toLowerCase().includes(emailFilter);
      const matchNumero = !numeroLigneFilter || client.numeroLigne?.toString().includes(numeroLigneFilter);
      
      return matchEmail && matchNumero;
    });
  }

  /**
   * Bascule le statut d'activation d'un client
   */
  toggleUserStatus(client: Utilisateur): void {
    if (!client.idUser) {
      this.notificationService.showError('ID utilisateur introuvable');
      return;
    }

    // Ouvrir le modal de confirmation
    this.selectedClient = client;
    this.isConfirmModalOpen = true;
  }

  /**
   * Ferme le modal de confirmation
   */
  closeConfirmModal(): void {
    this.isConfirmModalOpen = false;
    this.selectedClient = null;
    this.isProcessing = false;
  }

  /**
   * Ouvre le modal de contrat pour un client
   */
  viewContract(client: Utilisateur): void {
    this.selectedClientContract = client;
    this.isContractModalOpen = true;
  }

  /**
   * Ouvre le modal de profil pour un client
   */
  viewProfile(client: Utilisateur): void {
    this.selectedClientContract = client;
    this.isContractModalOpen = true;
  }

  /**
   * Ferme le modal de contrat
   */
  closeContractModal(): void {
    this.isContractModalOpen = false;
    this.selectedClientContract = null;
  }

  /**
   * Ouvre un nouvel onglet pour écrire un contrat
   */
  writeContract(client: Utilisateur): void {
    // Ouvrir un nouvel onglet avec l'éditeur de contrat
    const contractUrl = `/admin/contract-editor/${client.idUser}`;
    window.open(contractUrl, '_blank');
  }

  /**
   * Ouvre le contrat existant du client dans un nouvel onglet
   */
  openContract(client: Utilisateur): void {
    if (client.documentContrat) {
      // Ouvrir le contrat dans un nouvel onglet
      window.open(client.documentContrat, '_blank');
    } else {
      this.notificationService.showError('Aucun contrat disponible pour ce client');
    }
  }

  /**
   * Confirme et exécute le changement de statut
   */
  confirmToggleStatus(): void {
    if (!this.selectedClient || !this.selectedClient.idUser) {
      this.notificationService.showError('Utilisateur non sélectionné');
      return;
    }

    this.isProcessing = true;
    
    this.gestionUserService.toggleStatut(this.selectedClient.idUser).subscribe({
      next: (updatedClient) => {
        console.log('Statut modifié:', updatedClient);
        
        // Mettre à jour le client dans la liste
        const index = this.clients.findIndex(c => c.idUser === this.selectedClient?.idUser);
        if (index !== -1) {
          this.clients[index] = updatedClient;
          this.applyFilters(); // Réappliquer les filtres
        }
        
        const status = updatedClient.etatCompte === 'ACTIF' ? 'activé' : 'désactivé';
        this.notificationService.showSuccess(`Compte ${status} avec succès`);
        
        // Fermer le modal
        this.closeConfirmModal();
      },
      error: (error) => {
        console.error('Erreur lors de la modification du statut:', error);
        this.notificationService.showError('Erreur lors de la modification du statut');
        this.isProcessing = false;
      }
    });
  }

  /**
   * Obtient le statut d'un utilisateur de façon sécurisée
   */
  getUserStatus(client: Utilisateur): boolean {
    return client.etatCompte === 'ACTIF';
  }

  /**
   * Réinitialise tous les filtres
   */
  clearFilters(): void {
    this.filterForm.reset();
  }

  /**
   * Retourne à la page d'accueil admin
   */
  goBack(): void {
    this.router.navigate(['/adminhome',this.gestionUserService.getCurrentUser()?.prenomUser + this.gestionUserService.getCurrentUser()?.nomUser]);
  }

  /**
   * Gère les erreurs d'image
   */
  onImageError(event: any): void {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2Yzc1N2QiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xMiAxMkM5LjUgMTIgNy41IDEwIDcuNSA3LjVTOS41IDMgMTIgM3MyIDQgNC41IDcuNVM5LjUgMTIgMTIgMTJaTTEyIDEzLjVjLTMgMC04IDEuNS04IDQuNXYyaDEydi0yYzAtM3M1LTQuNS04LTQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=';
  }

  /**
   * Formate la date d'inscription
   */
  formatDate(date: string | Date): string {
    if (!date) return 'Non renseigné';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
