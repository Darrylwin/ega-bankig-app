package com.ega.banking;

import com.ega.banking.entity.Role;
import com.ega.banking.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Classe principale de l'application Spring Boot
 * Point d'entrée de l'application
 */
@SpringBootApplication
public class EgaApplication {

    /**
     * Méthode principale qui démarre l'application
     */
    public static void main(String[] args) {
        SpringApplication.run(EgaApplication.class, args);
        System.out.println("========================================");
        System.out.println("🚀 EGA Banking Application Started!");
        System.out.println("📍 API: http://localhost:8080/api");
        System.out.println("📚 Swagger: http://localhost:8080/swagger-ui.html");
        System.out.println("========================================");
    }

    /**
     * Initialise les rôles dans la base de données au démarrage
     * CommandLineRunner s'exécute une fois au démarrage de l'application
     */
    @Bean
    CommandLineRunner initDatabase(RoleRepository roleRepository) {
        return args -> {
            // Crée le rôle ADMIN s'il n'existe pas
            if (roleRepository.findByName("ROLE_ADMIN").isEmpty()) {
                Role adminRole = new Role();
                adminRole.setName("ROLE_ADMIN");
                roleRepository.save(adminRole);
                System.out.println("✅ Role ROLE_ADMIN created");
            }

            // Crée le rôle USER s'il n'existe pas
            if (roleRepository.findByName("ROLE_USER").isEmpty()) {
                Role userRole = new Role();
                userRole.setName("ROLE_USER");
                roleRepository.save(userRole);
                System.out.println("✅ Role ROLE_USER created");
            }
        };
    }
}