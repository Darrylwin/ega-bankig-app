package com.ega.banking.controller;

import com.ega.banking.dto.*;
import com.ega.banking.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Contrôleur pour l'authentification et la gestion du profil
 * Gère l'inscription, la connexion, le profil et le changement de mot de passe
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Connecte un utilisateur par EMAIL + PASSWORD
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest) {
        AuthResponseDTO response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/auth/me
     * Récupère le profil de l'utilisateur connecté
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> getCurrentUser() {
        UserProfileDTO profile = authService.getCurrentUserProfile();
        return ResponseEntity.ok(profile);
    }

    /**
     * PUT /api/auth/change-password
     * Change le mot de passe de l'utilisateur connecté
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordRequestDTO request) {
        authService.changePassword(request);
        return ResponseEntity.ok("Password changed successfully");
    }

    /**
     * POST /api/auth/admin/create
     * Crée un nouvel administrateur (ADMIN uniquement)
     */
    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<AuthResponseDTO> createAdmin(@Valid @RequestBody CreateAdminRequestDTO request) {
        AuthResponseDTO response = authService.createAdmin(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}