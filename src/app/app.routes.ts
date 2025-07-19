import { Routes } from '@angular/router';
import { ClientdashboardComponent } from './FrontOffice/clientdashboard/clientdashboard.component';
import { ForgotpasswordComponent } from './FrontOffice/forgotpassword/forgotpassword.component';
import { HomeComponent } from './FrontOffice/HomePage/home/home.component';
import { LoginComponent } from './FrontOffice/login/login.component';
import { SignupComponent } from './FrontOffice/signup/signup.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

 { path: '', redirectTo: 'home', pathMatch: 'full' },

  {path:'home',component:HomeComponent},
  {path:'login',component:LoginComponent},
  {path:'signup',component:SignupComponent},
  {path:'forgot-password',component:ForgotpasswordComponent},

  {path:'clientdashboard',component:ClientdashboardComponent, canActivate: [authGuard]},
  {path:'client-dashboard',component:ClientdashboardComponent, canActivate: [authGuard]},


];
