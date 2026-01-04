package com. ega.banking.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security. Keys;
import org.springframework. beans.factory.annotation.Value;
import org.springframework.security. core.Authentication;
import org. springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Utilitaire pour générer et valider les tokens JWT
 */
@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    /**
     * Génère la clé de signature à partir du secret
     */
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Génère un token JWT à partir de l'authentification
     * @param authentication L'objet d'authentification Spring Security
     * @return Le token JWT
     */
    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        // Utiliser l'email
        return Jwts.builder()
                .setSubject(userPrincipal.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm. HS512)
                .compact();
    }

    /**
     * Extrait l'EMAIL du token JWT
     * @param token Le token JWT
     * @return L'email de l'utilisateur
     */
    public String getUsernameFromJwtToken(String token) {
        // ⚠️ Le nom de la méthode est trompeur, mais elle retourne l'email maintenant
        return Jwts. parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Valide le token JWT
     * @param authToken Le token à valider
     * @return true si valide, false sinon
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    . parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token is expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token is unsupported: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims string is empty: " + e.getMessage());
        }
        return false;
    }
}