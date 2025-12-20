package com.ega.banking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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
        System.out.println("📚 Swagger: http://localhost:8080/swagger-ui/index.html");
        System.out.println("========================================");
    }
}