import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbToastrService } from '@nebular/theme';
import { AuthApiService } from '../../../@core/data/api';
import { LoginRequest } from '../../../@core/data/models';

@Component({
  selector:  'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private router: Router,
    private toastr: NbToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Si déjà connecté, redirige vers dashboard
    if (this.authApi.isAuthenticated()) {
      this.router.navigate(['/pages/dashboard']);
    }
  }

  /**
   * ✅ Soumission du formulaire - Appelle l'API
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this. loginForm);
      return;
    }

    this.isLoading = true;

    const credentials: LoginRequest = {
      email: this.loginForm.value. email,
      password: this. loginForm.value.password
    };

    console.log('🔵 Login attempt with:', credentials. email);

    // ✅ APPELLE LE SERVICE QUI APPELLE L'API
    this. authApi.login(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('✅ Login successful:', response);
        
        this.toastr.success(`Bienvenue ${response.username} ! `, 'Connexion réussie');
        this.router. navigate(['/pages/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Login error:', error);
        
        if (error.status === 401) {
          this.toastr.danger('Email ou mot de passe incorrect', 'Erreur de connexion');
        } else if (error.status === 0) {
          this.toastr.danger('Impossible de joindre le serveur.  Vérifiez que l\'API est démarrée.', 'Erreur réseau');
        } else {
          this.toastr.danger('Une erreur est survenue', 'Erreur');
        }
        
        this.loginForm.patchValue({ password: '' });
      }
    });
  }

  /**
   * Affiche/Masque le mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Marque tous les champs comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Raccourci pour accéder aux contrôles
   */
  get f() {
    return this.loginForm. controls;
  }
}