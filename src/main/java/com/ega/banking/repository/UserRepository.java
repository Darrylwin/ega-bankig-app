package com.ega.banking.repository;

import com.ega.banking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'entité User
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Recherche un utilisateur par son nom d'utilisateur
     */
    Optional<User> findByUsername(String username);

    /**
     * Recherche un utilisateur par son email
     */
    Optional<User> findByEmail(String email);

    /**
     * Vérifie si un nom d'utilisateur existe
     */
    Boolean existsByUsername(String username);

    /**
     * Vérifie si un email existe
     */
    Boolean existsByEmail(String email);
}