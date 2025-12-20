package com.ega.banking.service;

import com.ega.banking.dto.AuthResponseDTO;
import com.ega.banking.dto.LoginRequestDTO;
import com.ega.banking.dto.RegisterRequestDTO;
import com.ega.banking.entity.Role;
import com.ega.banking.entity.User;
import com.ega.banking.exception.DuplicateResourceException;
import com.ega.banking.repository.RoleRepository;
import com.ega.banking.repository.UserRepository;
import com.ega.banking.security.JwtUtils;
import com.ega.banking.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Implémentation du service d'authentification
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    /**
     * Inscrit un nouvel utilisateur avec le rôle USER par défaut
     */
    @Override
    public AuthResponseDTO register(RegisterRequestDTO registerRequest) {
        // Vérifie que le nom d'utilisateur n'existe pas déjà
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new com.ega.banking.exception.UserAlreadyExistsException(
                    "Username", registerRequest.getUsername());
        }

        // Vérifie que l'email n'existe pas déjà
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new com.ega.banking.exception.UserAlreadyExistsException(
                    "Email", registerRequest.getEmail());
        }

        // Crée le nouvel utilisateur
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));  // Hash le mot de passe
        user.setEnabled(true);

        // Assigne le rôle USER par défaut
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new com.ega.banking.exception.RoleNotFoundException("ROLE_USER"));
        roles.add(userRole);
        user.setRoles(roles);

        // Sauvegarde l'utilisateur
        userRepository.save(user);

        // Authentifie automatiquement l'utilisateur après l'inscription
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            registerRequest.getUsername(),
                            registerRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Génère le token JWT
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Récupère les détails de l'utilisateur
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roleNames = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Retourne la réponse avec le token
            return new AuthResponseDTO(
                    jwt,
                    "Bearer",
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roleNames
            );
        } catch (Exception e) {
            throw new com.ega.banking.exception.AuthenticationFailedException(
                    "Authentication failed after registration: " + e.getMessage());
        }
    }

    /**
     * Connecte un utilisateur existant
     */
    @Override
    public AuthResponseDTO login(LoginRequestDTO loginRequest) {
        // Authentifie l'utilisateur
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Génère le token JWT
            String jwt = jwtUtils.generateJwtToken(authentication);

            // Récupère les détails de l'utilisateur
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Retourne la réponse avec le token
            return new AuthResponseDTO(
                    jwt,
                    "Bearer",
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    roles
            );
        } catch (Exception e) {
            throw new com.ega.banking.exception.AuthenticationFailedException(
                    "Invalid username or password");
        }
    }
}