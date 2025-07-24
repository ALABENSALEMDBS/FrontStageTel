import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRegistrationRequest } from '../../../../core/models/UserRegistrationRequest';
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
  
  // Variables pour le modal de création d'utilisateur
  isCreateUserModalOpen = false;
  createUserForm: FormGroup;
  isCreating = false;
  
  // Variables pour le modal des agents
  isAgentsModalOpen = false;
  agents: Utilisateur[] = [];
  isLoadingAgents = false;
  
  // Variables pour le modal de suppression
  isDeleteModalOpen = false;
  userToDelete: {user: Utilisateur, userType: 'client' | 'agent'} | null = null;
  isDeleting = false;
  
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
    
    this.createUserForm = this.fb.group({
      nomUser: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      prenomUser: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)]],
      emailUser: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      numeroLigne: [0, [Validators.min(0), Validators.max(99999999), Validators.pattern(/^\d{0,8}$/)]],
      idRole: ['', [Validators.required]]
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
   * Actualise la liste des clients
   */
  refreshClients(): void {
    console.log('🔄 Actualisation de la liste des clients...');
    this.loadClients();
  }

  /**
   * Retourne à la page d'accueil admin
   */
  goBack(): void {
    this.router.navigate(['/adminhome']);
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

  // ========== MÉTHODES POUR CRÉER UN UTILISATEUR ==========

  /**
   * Ouvre le modal de création d'utilisateur
   */
  openCreateUserModal(): void {
    this.isCreateUserModalOpen = true;
    this.createUserForm.reset();
  }

  /**
   * Ferme le modal de création d'utilisateur
   */
  closeCreateUserModal(): void {
    this.isCreateUserModalOpen = false;
    this.resetCreateUserForm();
    this.isCreating = false;
  }

  /**
   * Réinitialise le formulaire de création d'utilisateur
   */
  private resetCreateUserForm(): void {
    this.createUserForm.reset();
    this.createUserForm.patchValue({
      nomUser: '',
      prenomUser: '',
      emailUser: '',
      numeroLigne: 0,
      idRole: ''
    });
    
    // Marquer tous les champs comme non touchés
    Object.keys(this.createUserForm.controls).forEach(key => {
      this.createUserForm.get(key)?.markAsUntouched();
      this.createUserForm.get(key)?.markAsPristine();
    });
  }

  /**
   * Crée un nouveau compte utilisateur
   */
  createUser(): void {
    if (this.createUserForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched(this.createUserForm);
      this.notificationService.showError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    // Validation supplémentaire pour l'email
    const emailValue = this.createUserForm.get('emailUser')?.value?.toLowerCase().trim();
    if (this.isEmailAlreadyUsed(emailValue)) {
      this.notificationService.showError('Cette adresse email est déjà utilisée');
      return;
    }

    // Validation pour le numéro de ligne
    const numeroLigne = this.createUserForm.get('numeroLigne')?.value;
    if (numeroLigne && numeroLigne > 0 && this.isPhoneNumberAlreadyUsed(numeroLigne)) {
      this.notificationService.showError('Ce numéro de ligne est déjà attribué');
      return;
    }

    this.isCreating = true;
    const formData = this.createUserForm.value;
    
    // Créer l'objet de requête d'inscription avec nettoyage des données
    const registrationRequest = new UserRegistrationRequest();
    registrationRequest.nomUser = formData.nomUser?.trim();
    registrationRequest.prenomUser = formData.prenomUser?.trim();
    registrationRequest.emailUser = emailValue;
    registrationRequest.numeroLigne = numeroLigne || 0;
    registrationRequest.idRole = parseInt(formData.idRole);

    console.log('🔄 Création d\'un compte utilisateur...', registrationRequest);

    this.gestionUserService.creerCompteByAdmin(registrationRequest).subscribe({
      next: (response) => {
        console.log('✅ Compte créé avec succès:', response);
        let roleText = 'client';
        if (formData.idRole === '1') {
          roleText = 'administrateur';
        } else if (formData.idRole === '2') {
          roleText = 'agent';
        }
        this.notificationService.showSuccess(`Compte ${roleText} créé avec succès pour ${formData.prenomUser} ${formData.nomUser}`);
        this.closeCreateUserModal();
        
        // Recharger la liste appropriée
        if (formData.idRole === '2') {
          this.loadAgents(); // Recharger les agents si c'est un agent
        } else {
          this.loadClients(); // Recharger les clients pour admin et client
        }
        
        this.isCreating = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du compte:', error);
        let errorMessage = 'Erreur lors de la création du compte';
        
        if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies';
        } else if (error.status === 409) {
          errorMessage = 'Cette adresse email est déjà utilisée';
        } else if (error.status === 422) {
          errorMessage = 'Format des données incorrect';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard';
        }
        
        this.notificationService.showError(errorMessage);
        this.isCreating = false;
      }
    });
  }

  // ========== MÉTHODES POUR CONSULTER LES AGENTS ==========

  /**
   * Ouvre le modal des agents
   */
  openAgentsModal(): void {
    this.isAgentsModalOpen = true;
    this.loadAgents();
  }

  /**
   * Ferme le modal des agents
   */
  closeAgentsModal(): void {
    this.isAgentsModalOpen = false;
  }

  /**
   * Charge tous les agents
   */
  loadAgents(): void {
    this.isLoadingAgents = true;
    
    // Utiliser la méthode spécifique pour récupérer tous les agents
    this.gestionUserService.getAllAgents().subscribe({
      next: (agents) => {
        this.agents = agents;
        console.log('📋 Agents chargés:', this.agents);
        this.isLoadingAgents = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des agents:', error);
        this.notificationService.showError('Erreur lors du chargement des agents');
        this.isLoadingAgents = false;
      }
    });
  }

  /**
   * Actualise la liste des agents
   */
  refreshAgents(): void {
    this.loadAgents();
  }

  /**
   * Active/désactive un agent
   */
  toggleAgentStatus(agent: Utilisateur): void {
    console.log('🔄 Changement de statut pour l\'agent:', agent);
    
    this.gestionUserService.toggleStatut(agent.idUser).subscribe({
      next: (updatedAgent) => {
        console.log('✅ Statut de l\'agent modifié:', updatedAgent);
        
        // Mettre à jour l'agent dans la liste
        const index = this.agents.findIndex(a => a.idUser === agent.idUser);
        if (index !== -1) {
          this.agents[index] = updatedAgent;
        }
        
        const newStatus = updatedAgent.etatCompte === 'ACTIF' ? 'activé' : 'désactivé';
        this.notificationService.showSuccess(`Agent ${agent.prenomUser} ${agent.nomUser} ${newStatus} avec succès`);
      },
      error: (error) => {
        console.error('❌ Erreur lors du changement de statut:', error);
        this.notificationService.showError('Erreur lors du changement de statut de l\'agent');
      }
    });
  }

  // ========== MÉTHODES DE VALIDATION ==========

  /**
   * Marque tous les champs d'un FormGroup comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Vérifie si l'email est déjà utilisé
   */
  private isEmailAlreadyUsed(email: string): boolean {
    if (!email) return false;
    
    const emailLower = email.toLowerCase().trim();
    
    // Vérifier dans la liste des clients
    const emailExistsInClients = this.clients.some(client => 
      client.emailUser?.toLowerCase().trim() === emailLower
    );
    
    // Vérifier dans la liste des agents
    const emailExistsInAgents = this.agents.some(agent => 
      agent.emailUser?.toLowerCase().trim() === emailLower
    );
    
    return emailExistsInClients || emailExistsInAgents;
  }

  /**
   * Vérifie si le numéro de ligne est déjà utilisé
   */
  private isPhoneNumberAlreadyUsed(numeroLigne: number): boolean {
    if (!numeroLigne || numeroLigne <= 0) return false;
    
    // Vérifier dans la liste des clients
    const phoneExistsInClients = this.clients.some(client => 
      client.numeroLigne === numeroLigne
    );
    
    // Vérifier dans la liste des agents (si les agents ont des numéros de ligne)
    const phoneExistsInAgents = this.agents.some(agent => 
      agent.numeroLigne === numeroLigne
    );
    
    return phoneExistsInClients || phoneExistsInAgents;
  }

  /**
   * Limite le nombre de chiffres dans un input numérique
   */
  limitDigits(event: any, maxDigits: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Supprimer tout ce qui n'est pas un chiffre
    
    if (value.length > maxDigits) {
      value = value.substring(0, maxDigits);
    }
    
    // Mettre à jour la valeur de l'input et du FormControl
    input.value = value;
    this.createUserForm.get('numeroLigne')?.setValue(parseInt(value) || 0);
  }

  // ========== MÉTHODES DE SUPPRESSION ==========

  /**
   * Ouvre le modal de confirmation pour supprimer un client
   */
  confirmDeleteClient(client: Utilisateur): void {
    this.userToDelete = {
      user: client,
      userType: 'client'
    };
    this.isDeleteModalOpen = true;
  }

  /**
   * Ouvre le modal de confirmation pour supprimer un agent
   */
  confirmDeleteAgent(agent: Utilisateur): void {
    this.userToDelete = {
      user: agent,
      userType: 'agent'
    };
    this.isDeleteModalOpen = true;
  }

  /**
   * Ferme le modal de confirmation de suppression
   */
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.userToDelete = null;
    this.isDeleting = false;
  }

  /**
   * Confirme et exécute la suppression de l'utilisateur
   */
  confirmDeleteUser(): void {
    if (!this.userToDelete || !this.userToDelete.user.idUser) {
      this.notificationService.showError('Utilisateur non sélectionné');
      return;
    }

    this.isDeleting = true;
    const userToDelete = this.userToDelete.user;
    const userType = this.userToDelete.userType;

    this.gestionUserService.deleteUser(userToDelete.idUser).subscribe({
      next: (message) => {
        console.log('✅ Utilisateur supprimé:', message);
        
        // Supprimer l'utilisateur de la liste appropriée
        if (userType === 'client') {
          this.clients = this.clients.filter(c => c.idUser !== userToDelete.idUser);
          this.applyFilters(); // Réappliquer les filtres
          this.notificationService.showSuccess(`Client ${userToDelete.prenomUser} ${userToDelete.nomUser} supprimé avec succès`);
        } else {
          this.agents = this.agents.filter(a => a.idUser !== userToDelete.idUser);
          this.notificationService.showSuccess(`Agent ${userToDelete.prenomUser} ${userToDelete.nomUser} supprimé avec succès`);
        }
        
        this.closeDeleteModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la suppression:', error);
        let errorMessage = 'Erreur lors de la suppression';
        
        if (error.status === 404) {
          errorMessage = 'Utilisateur introuvable';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les droits pour supprimer cet utilisateur';
        } else if (error.status === 409) {
          errorMessage = 'Impossible de supprimer cet utilisateur car il a des données liées';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de la suppression';
        }
        
        this.notificationService.showError(errorMessage);
        this.isDeleting = false;
      }
    });
  }
}
