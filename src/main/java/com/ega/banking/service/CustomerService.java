package com.ega.banking.service;

import com.ega.banking.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Interface définissant les opérations métier pour les clients
 * Respecte le principe d'inversion de dépendances (SOLID)
 * Les contrôleurs dépendront de cette interface, pas de l'implémentation
 */
public interface CustomerService {

    /**
     * Crée un nouveau client
     * Vérifie que l'email et le téléphone sont uniques
     * Vérifie que le client a au moins 18 ans
     * @param customer Le client à créer
     * @return Le client créé avec son ID
     */
    Customer createCustomer(Customer customer);

    /**
     * Récupère tous les clients
     * @return Liste de tous les clients
     */
    List<Customer> getAllCustomers();

    @Transactional(readOnly = true)
    Page<Customer> getAllCustomers(org.springframework.data.domain.Pageable pageable);

    /**
     * Récupère un client par son ID
     * @param id L'ID du client
     * @return Le client trouvé
     * @throws RuntimeException si le client n'existe pas
     */
    Customer getCustomerById(Long id);

    /**
     * Met à jour un client existant
     * @param id L'ID du client à modifier
     * @param customer Les nouvelles données
     * @return Le client mis à jour
     * @throws RuntimeException si le client n'existe pas
     */
    Customer updateCustomer(Long id, Customer customer);

    /**
     * Supprime un client
     * Supprime aussi tous ses comptes (cascade)
     * @param id L'ID du client à supprimer
     * @throws RuntimeException si le client n'existe pas
     */
    void deleteCustomer(Long id);

    /**
     * Récupère un client par son email
     * @param email L'email du client
     * @return Le client trouvé
     * @throws RuntimeException si le client n'existe pas
     */
    Customer getCustomerByEmail(String email);
}