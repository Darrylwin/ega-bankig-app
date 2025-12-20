package com.ega.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour la réponse d'authentification
 * Retourné après connexion ou inscription réussie
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {

    private String token;  // Token JWT
    private String type = "Bearer";  // Type de token
    private Long id;
    private String username;
    private String email;
    private List<String> roles;  // Liste des rôles de l'utilisateur
}