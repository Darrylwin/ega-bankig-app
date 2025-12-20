package com.ega.banking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration CORS (Cross-Origin Resource Sharing)
 * Permet à Angular (ou autre frontend) d'appeler notre API
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")  // Applique CORS à toutes les URLs /api/**
                .allowedOrigins(allowedOrigins.split(","))  // Origines autorisées (séparées par virgule)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Méthodes HTTP autorisées
                .allowedHeaders("*")  // Tous les headers autorisés
                .allowCredentials(true)  // Autorise l'envoi de cookies
                .maxAge(3600);  // Cache la config CORS pendant 1 heure
    }
}