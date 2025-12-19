package com.ega.banking.repository;

import com.ega.banking.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour l'entité Customer
 * JpaRepository fournit automatiquement les méthodes CRUD :
 * - save() : créer/mettre à jour
 * - findById() : rechercher par ID
 * - findAll() : récupérer tous les clients
 * - deleteById() : supprimer par ID
 * - count() : compter les clients
 * etc.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    /**
     * Recherche un client par son email
     * Spring génère automatiquement la requête SQL :
     * SELECT * FROM customers WHERE email = ?
     * @param email L'email à rechercher
     * @return Optional contenant le client si trouvé, vide sinon
     */
    Optional<Customer> findByEmail(String email);

    /**
     * Recherche un client par son numéro de téléphone
     * Spring génère : SELECT * FROM customers WHERE phone_number = ?
     * @param phoneNumber Le numéro à rechercher
     * @return Optional contenant le client si trouvé, vide sinon
     */
    Optional<Customer> findByPhoneNumber(String phoneNumber);

    /**
     * Vérifie si un email existe déjà
     * Spring génère : SELECT COUNT(*) > 0 FROM customers WHERE email = ?
     * @param email L'email à vérifier
     * @return true si l'email existe, false sinon
     */
    boolean existsByEmail(String email);

    /**
     * Vérifie si un numéro de téléphone existe déjà
     * Spring génère : SELECT COUNT(*) > 0 FROM customers WHERE phone_number = ?
     * @param phoneNumber Le numéro à vérifier
     * @return true si le numéro existe, false sinon
     */
    boolean existsByPhoneNumber(String phoneNumber);
}