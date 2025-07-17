import { Routes } from '@angular/router';
import { HomeComponent } from './FrontOffice/HomePage/home/home.component';
import { LoginComponent } from './FrontOffice/login/login.component';
import { SignupComponent } from './FrontOffice/signup/signup.component';
import { ForgotpasswordComponent } from './FrontOffice/forgotpassword/forgotpassword.component';

export const routes: Routes = [

 { path: '', redirectTo: 'home', pathMatch: 'full' },

  {path:'home',component:HomeComponent},
  {path:'login',component:LoginComponent},
  {path:'signup',component:SignupComponent},
  {path:'forgot-password',component:ForgotpasswordComponent},



];
