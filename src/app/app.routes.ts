import { Routes } from '@angular/router';
import { AdminhomeComponent } from './BackOffice/admin/adminhome/adminhome.component';
import { ClientdashboardComponent } from './FrontOffice/clientdashboard/clientdashboard.component';
import { ForgotpasswordComponent } from './FrontOffice/forgotpassword/forgotpassword.component';
import { HomeComponent } from './FrontOffice/HomePage/home/home.component';
import { LoginComponent } from './FrontOffice/login/login.component';
import { SignupComponent } from './FrontOffice/signup/signup.component';
import { adminGuard, agentGuard, clientGuard } from './guards/auth.guard';
import { AgenthomeComponent } from './BackOffice/agent/agenthome/agenthome.component';

export const routes: Routes = [

 { path: '', redirectTo: 'home', pathMatch: 'full' },

  {path:'home',component:HomeComponent},
  {path:'login',component:LoginComponent},
  {path:'signup',component:SignupComponent},
  {path:'forgot-password',component:ForgotpasswordComponent},

  {path:'clientdashboard',component:ClientdashboardComponent, canActivate: [clientGuard]},
  {path:'client-dashboard/:userName',component:ClientdashboardComponent, canActivate: [clientGuard]},
  {path:'adminhome/:userName',component:AdminhomeComponent, canActivate: [adminGuard]},

  {path:'agenthome/:userName',component:AgenthomeComponent, canActivate: [agentGuard]},


];
