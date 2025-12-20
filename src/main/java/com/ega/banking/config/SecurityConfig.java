package com.ega.banking.config;

import com.ega.banking.security.AuthEntryPointJwt;
import com.ega.banking.security.JwtAuthenticationFilter;
import com.ega.banking.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuration de la sécurité Spring Security
 * Définit les règles d'authentification et d'autorisation
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // Active @PreAuthorize, @Secured, etc.
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    /**
     * Bean pour encoder les mots de passe avec BCrypt
     * BCrypt est un algorithme de hachage sécurisé
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Provider d'authentification qui utilise UserDetailsService
     * Note : Dans Spring Security 6+, on passe directement le UserDetailsService
     * via le constructeur au lieu de setUserDetailsService()
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Bean AuthenticationManager pour gérer l'authentification
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig)
            throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Configuration de la chaîne de sécurité
     * Définit quelles URLs sont publiques et lesquelles nécessitent une authentification
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Désactive CSRF (pas nécessaire pour API REST avec JWT)
                .csrf(csrf -> csrf.disable())

                // Gère les erreurs d'authentification
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler))

                // Pas de session (stateless avec JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Définit les autorisations
                .authorizeHttpRequests(auth -> auth
                        // URLs publiques - Authentification
                        .requestMatchers("/api/auth/**").permitAll()

                        // URLs publiques - Swagger/OpenAPI Documentation (TOUT OUVRIR)
                        .requestMatchers("/swagger-ui/**").permitAll()
                        .requestMatchers("/swagger-ui.html").permitAll()
                        .requestMatchers("/v3/**").permitAll()
                        .requestMatchers("/swagger-resources/**").permitAll()
                        .requestMatchers("/webjars/**").permitAll()
                        .requestMatchers("/configuration/**").permitAll()

                        // Toutes les autres URLs nécessitent une authentification
                        .anyRequest().authenticated()
                );

        // Ajoute le provider d'authentification
        http.authenticationProvider(authenticationProvider());

        // Ajoute le filtre JWT avant le filtre d'authentification standard
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}