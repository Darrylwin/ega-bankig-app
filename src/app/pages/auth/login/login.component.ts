import { Component, OnInit, OnDestroy, ViewEncapsulation } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { AuthApiService } from "../../../@core/data/api";
import { LoginRequest } from "../../../@core/data/models";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "ngx-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authApi: AuthApiService,
    private router: Router,
    private toastr: NbToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    // Redirection si déjà authentifié
    if (this.authApi.isAuthenticated()) {
      this.router.navigate(["/pages/dashboard"]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Soumission du formulaire de connexion
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;

    const credentials: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authApi
      .login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.toastr.success(
            `Bienvenue ${response.username} !`,
            "Connexion réussie"
          );
          this.router.navigate(["/pages/dashboard"]);
        },
        error: (error) => {
          this.isLoading = false;
          this.handleLoginError(error);
          this.loginForm.patchValue({ password: "" });
        },
      });
  }

  /**
   * Gestion des erreurs de connexion
   */
  private handleLoginError(error: any): void {
    if (error.status === 401) {
      this.toastr.danger(
        "Email ou mot de passe incorrect",
        "Erreur de connexion"
      );
    } else if (error.status === 0) {
      this.toastr.danger(
        "Impossible de joindre le serveur.  Vérifiez que l'API est démarrée.",
        "Erreur réseau"
      );
    } else {
      this.toastr.danger(
        error.error?.message || "Une erreur est survenue",
        "Erreur"
      );
    }
  }

  /**
   * Affiche/Masque le mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Raccourci pour accéder aux contrôles du formulaire
   */
  get f() {
    return this.loginForm.controls;
  }
}
