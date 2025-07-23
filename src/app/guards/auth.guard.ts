import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GestionuserService } from '../services/gestionUserSerice/gestionuser.service';

export const authGuard: CanActivateFn = (route, state) => {
  const gestionUserService = inject(GestionuserService);
  const router = inject(Router);

  if (gestionUserService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const clientGuard: CanActivateFn = (route, state) => {
  const gestionUserService = inject(GestionuserService);
  const router = inject(Router);

  console.log("🛡️ ClientGuard - Vérification d'accès au dashboard client");
  console.log("🔗 URL actuelle:", state.url);

  // Vérifier d'abord si l'utilisateur est authentifié
  if (!gestionUserService.isAuthenticated()) {
    console.log("❌ ClientGuard - Utilisateur non authentifié");
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les données de l'utilisateur
  const currentUser = gestionUserService.getCurrentUser();
  console.log("👤 ClientGuard - Données utilisateur:", currentUser);
  
  // Vérifier si l'utilisateur existe et a le rôle CLIENT
  if (currentUser && currentUser.role === 'ROLE_CLIENT') {
    //***************** */
    // Vérifier le paramètre userName dans l'URL si présent
    const userNameFromUrl = route.params['userName'];
    if (userNameFromUrl) {
      const expectedUserName = `${currentUser.prenomUser}${currentUser.nomUser}`;
      console.log("🔍 Vérification nom utilisateur - URL:", userNameFromUrl, "Attendu:", expectedUserName);
      
      if (userNameFromUrl !== expectedUserName) {
        console.log("⚠️ Nom d'utilisateur incorrect dans l'URL");
        // Rediriger vers la bonne URL avec le bon nom
        router.navigate(['/client-dashboard', expectedUserName]);
        return false;
      }
    }
    //**************** */
    console.log("✅ ClientGuard - Accès autorisé pour le rôle CLIENT");
    return true;
  } else {
    console.log("❌ ClientGuard - Accès refusé");
    console.log("🎭 Rôle actuel:", currentUser?.role);
    
    // Rediriger vers une page d'erreur ou login selon le cas
    if (!currentUser) {
      console.log("🔄 Redirection vers login - Pas de données utilisateur");
      router.navigate(['/login']);
    } else {
      // Utilisateur connecté mais pas le bon rôle
      console.log("🚫 Redirection vers login - Rôle incorrect");
      alert(`Accès refusé: Cette page est réservée aux clients. Votre rôle: ${currentUser.role}`);
      router.navigate(['/home']); // Rediriger vers la page d'accueil
    }
    return false;
  }
};

export const adminGuard: CanActivateFn = (route, state) => {
  const gestionUserService = inject(GestionuserService);
  const router = inject(Router);

  console.log("🛡️ AdminGuard - Vérification d'accès à l'interface admin");

  // Vérifier d'abord si l'utilisateur est authentifié
  if (!gestionUserService.isAuthenticated()) {
    console.log("❌ AdminGuard - Utilisateur non authentifié");
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les données de l'utilisateur
  const currentUser = gestionUserService.getCurrentUser();
  console.log("👤 AdminGuard - Données utilisateur:", currentUser);
  
  // Vérifier si l'utilisateur existe et a le rôle ADMIN
  if (currentUser && currentUser.role === 'ROLE_ADMIN') {
    console.log("✅ AdminGuard - Accès autorisé pour le rôle ADMIN");
    return true;
  } else {
    console.log("❌ AdminGuard - Accès refusé");
    console.log("🎭 Rôle actuel:", currentUser?.role);
    
    // Rediriger vers une page d'erreur ou login selon le cas
    if (!currentUser) {
      console.log("🔄 Redirection vers login - Pas de données utilisateur");
      router.navigate(['/login']);
    } else {
      // Utilisateur connecté mais pas le bon rôle
      console.log("🚫 Redirection vers home - Rôle incorrect pour admin");
      alert(`Accès refusé: Cette page est réservée aux administrateurs. Votre rôle: ${currentUser.role}`);
      router.navigate(['/home']); // Rediriger vers la page d'accueil
    }
    return false;
  }
};








export const agentGuard: CanActivateFn = (route, state) => {
  const gestionUserService = inject(GestionuserService);
  const router = inject(Router);

  console.log("🛡️ AgentGuard - Vérification d'accès à l'interface agent");

  // Vérifier d'abord si l'utilisateur est authentifié
  if (!gestionUserService.isAuthenticated()) {
    console.log("❌ AgentGuard - Utilisateur non authentifié");
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les données de l'utilisateur
  const currentUser = gestionUserService.getCurrentUser();
  console.log("👤 AgentGuard - Données utilisateur:", currentUser);
  
  // Vérifier si l'utilisateur existe et a le rôle Agent
  if (currentUser && currentUser.role === 'ROLE_AGENT') {
     // Vérifier le paramètre userName dans l'URL si présent
    const userNameFromUrl = route.params['userName'];
    if (userNameFromUrl) {
      const expectedUserName = `${currentUser.prenomUser}${currentUser.nomUser}`;
      console.log("🔍 Vérification nom utilisateur - URL:", userNameFromUrl, "Attendu:", expectedUserName);
      
      if (userNameFromUrl !== expectedUserName) {
        console.log("⚠️ Nom d'utilisateur incorrect dans l'URL");
        // Rediriger vers la bonne URL avec le bon nom
        router.navigate(['/agenthome', expectedUserName]);
        return false;
      }
    }
    console.log("✅ AgentGuard - Accès autorisé pour le rôle Agent");
    return true;
  } else {
    console.log("❌ AgentGuard - Accès refusé");
    console.log("🎭 Rôle actuel:", currentUser?.role);
    
    // Rediriger vers une page d'erreur ou login selon le cas
    if (!currentUser) {
      console.log("🔄 Redirection vers login - Pas de données utilisateur");
      router.navigate(['/login']);
    } else {
      // Utilisateur connecté mais pas le bon rôle
      console.log("🚫 Redirection vers home - Rôle incorrect pour agent");
      alert(`Accès refusé: Cette page est réservée aux agents. Votre rôle: ${currentUser.role}`);
      router.navigate(['/home']); // Rediriger vers la page d'accueil
    }
    return false;
  }
};
