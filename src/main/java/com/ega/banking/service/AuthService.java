package com.ega.banking.service;

import com.ega.banking.dto.AuthResponseDTO;
import com.ega.banking.dto.ChangePasswordRequestDTO;
import com.ega.banking.dto.CreateAdminRequestDTO;
import com.ega.banking.dto.LoginRequestDTO;
import com.ega.banking.dto.RegisterRequestDTO;
import com.ega.banking.dto.UserProfileDTO;

/**
 * Interface du service d'authentification
 */
public interface AuthService {

    /**
     * Inscrit un nouvel utilisateur
     * @param registerRequest Données d'inscription
     * @return Réponse avec token JWT
     */
    AuthResponseDTO register(RegisterRequestDTO registerRequest);

    /**
     * Connecte un utilisateur par EMAIL + PASSWORD
     * @param loginRequest Données de connexion (email + password)
     * @return Réponse avec token JWT
     */
    AuthResponseDTO login(LoginRequestDTO loginRequest);

    /**
     * Récupère le profil de l'utilisateur connecté
     * @return Profil utilisateur
     */
    UserProfileDTO getCurrentUserProfile();

    /**
     * Change le mot de passe de l'utilisateur connecté
     * @param request Ancien et nouveau mot de passe
     */
    void changePassword(ChangePasswordRequestDTO request);

    /**
     * Crée un nouvel administrateur (ADMIN uniquement)
     * @param request Données du nouvel admin
     * @return Détails du compte admin créé
     */
    AuthResponseDTO createAdmin(CreateAdminRequestDTO request);
}