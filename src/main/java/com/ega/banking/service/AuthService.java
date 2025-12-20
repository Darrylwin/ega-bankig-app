package com.ega.banking.service;

import com.ega.banking.dto.AuthResponseDTO;
import com.ega.banking.dto.LoginRequestDTO;
import com.ega.banking.dto.RegisterRequestDTO;

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
     * Connecte un utilisateur
     * @param loginRequest Données de connexion
     * @return Réponse avec token JWT
     */
    AuthResponseDTO login(LoginRequestDTO loginRequest);
}