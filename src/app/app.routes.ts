import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component'; // adjust the path according to your project structure

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent }
];