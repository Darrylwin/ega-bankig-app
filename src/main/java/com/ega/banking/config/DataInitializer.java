package com.ega.banking.config;

import com.ega.banking.entity.Role;
import com.ega.banking.entity.User;
import com.ega.banking.repository.RoleRepository;
import com.ega.banking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

/**
 * Initialise les données de base au démarrage de l'application
 * Script interactif en console pour créer un administrateur
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initDatabase() {
        return args -> {
            log.info("========================================");
            log.info("🔧 Initialisation de la base de données...");
            log.info("========================================");

            // 1. Créer les rôles
            Role adminRole = createRoleIfNotExists("ROLE_ADMIN");
            Role userRole = createRoleIfNotExists("ROLE_USER");

            // 2. Vérifier s'il existe déjà un administrateur
            boolean adminExists = userRepository.findAll().stream()
                    .anyMatch(user -> user.getRoles().stream()
                            .anyMatch(role -> role.getName().equals("ROLE_ADMIN")));

            if (!adminExists) {
                log.info("========================================");
                log.info("⚠️  Aucun compte administrateur trouvé !");
                log.info("========================================");

                // Lancer le script interactif pour créer un admin
                createAdminInteractive(adminRole, userRole);
            } else {
                log.info("✅ Compte administrateur déjà existant");
            }

            log.info("========================================");
            log.info("✅ Initialisation terminée !");
            log.info("========================================");
        };
    }

    /**
     * Crée un rôle s'il n'existe pas déjà
     */
    private Role createRoleIfNotExists(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    roleRepository.save(role);
                    log.info("✅ Rôle créé : {}", roleName);
                    return role;
                });
    }

    /**
     * Script interactif pour créer un compte administrateur
     * Demande les informations à l'utilisateur via la console
     */
    private void createAdminInteractive(Role adminRole, Role userRole) {
        Scanner scanner = new Scanner(System.in);

        try {
            System.out.println("\n╔════════════════════════════════════════╗");
            System.out.println("║   CRÉATION DU COMPTE ADMINISTRATEUR   ║");
            System.out.println("╚════════════════════════════════════════╝\n");

            // Demander l'email
            String email;
            while (true) {
                System.out.print("📧 Email (utilisé pour la connexion) : ");
                email = scanner.nextLine().trim();

                if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                    System.out.println("❌ Format d'email invalide.");
                    continue;
                }

                if (userRepository.existsByEmail(email)) {
                    System.out.println("❌ Cet email existe déjà.");
                    continue;
                }

                break;
            }

            // Demander le nom d'utilisateur (optionnel, juste pour l'affichage)
            String username;
            while (true) {
                System.out.print("👤 Nom d'utilisateur (pour l'affichage, min 3 caractères) : ");
                username = scanner.nextLine().trim();

                if (username.length() < 3) {
                    System.out.println("❌ Le nom d'utilisateur doit contenir au moins 3 caractères.");
                    continue;
                }

                if (userRepository.existsByUsername(username)) {
                    System.out.println("❌ Ce nom d'utilisateur existe déjà.");
                    continue;
                }

                break;
            }

            // Demander le mot de passe
            String password;
            while (true) {
                System.out.print("🔒 Mot de passe (min 6 caractères) : ");
                password = scanner.nextLine().trim();

                if (password.length() < 6) {
                    System.out.println("❌ Le mot de passe doit contenir au moins 6 caractères.");
                    continue;
                }

                System.out.print("🔒 Confirmer le mot de passe : ");
                String confirmPassword = scanner.nextLine().trim();

                if (!password.equals(confirmPassword)) {
                    System.out.println("❌ Les mots de passe ne correspondent pas.");
                    continue;
                }

                break;
            }

            // Créer l'administrateur
            User admin = new User();
            admin.setUsername(username);
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setEnabled(true);

            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(userRole);
            admin.setRoles(roles);

            userRepository.save(admin);

            System.out.println("\n╔════════════════════════════════════════╗");
            System.out.println("║    ✅ ADMINISTRATEUR CRÉÉ AVEC SUCCÈS  ║");
            System.out.println("╚════════════════════════════════════════╝");
            System.out.println("\n📋 Informations du compte :");
            System.out.println("   Email    : " + email);
            System.out.println("   Username : " + username);
            System.out.println("   Rôles    : ADMIN, USER");
            System.out.println("\n🔐 Conservez ces informations en lieu sûr !");
            System.out.println("========================================\n");

        } catch (Exception e) {
            log.error("❌ Erreur lors de la création de l'administrateur : {}", e.getMessage());
            System.out.println("\n❌ Erreur : Impossible de créer l'administrateur.");
            System.out.println("Vous pouvez créer un admin manuellement via l'API /api/auth/register");
            System.out.println("puis mettre à jour son rôle en base de données.\n");
        }
    }
}