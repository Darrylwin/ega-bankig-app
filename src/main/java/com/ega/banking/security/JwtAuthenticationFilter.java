package com.ega.banking.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre qui intercepte chaque requête pour valider le token JWT
 * S'exécute une fois par requête (OncePerRequestFilter)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    /**
     * Méthode principale du filtre
     * Extrait le token JWT du header Authorization et valide l'utilisateur
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Extrait le token JWT du header Authorization
            String jwt = parseJwt(request);

            // Si un token existe et qu'il est valide
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // Extrait le nom d'utilisateur du token
                String username = jwtUtils.getUsernameFromJwtToken(jwt);

                // Charge les détails de l'utilisateur
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Crée l'objet d'authentification
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Met l'authentification dans le contexte de sécurité
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.err.println("Cannot set user authentication: " + e.getMessage());
        }

        // Continue la chaîne de filtres
        filterChain.doFilter(request, response);
    }

    /**
     * Extrait le token JWT du header Authorization
     * Format attendu : "Bearer <token>"
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);  // Enlève "Bearer "
        }

        return null;
    }
}