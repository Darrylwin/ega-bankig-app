package com.ega.banking.service;

import com.ega.banking.entity.Customer;
import com.ega.banking.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service Customer
 * Contient toute la logique métier pour gérer les clients
 */
@Service  // Indique à Spring que c'est un service
@RequiredArgsConstructor  // Lombok génère un constructeur avec les champs final (injection de dépendances)
@Transactional  // Toutes les méthodes sont transactionnelles (rollback automatique en cas d'erreur)
public class CustomerServiceImpl implements CustomerService {

    // Injection de dépendances par constructeur (meilleure pratique)
    // Le repository est injecté automatiquement par Spring
    private final CustomerRepository customerRepository;

    /**
     * Crée un nouveau client après validation
     */
    @Override
    public Customer createCustomer(Customer customer) {
        // Vérification : l'email doit être unique
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new RuntimeException("Email already exists: " + customer.getEmail());
        }

        // Vérification : le téléphone doit être unique
        if (customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new RuntimeException("Phone number already exists: " + customer.getPhoneNumber());
        }

        // Vérification : le client doit avoir au moins 18 ans
        if (customer.getAge() < 18) {
            throw new RuntimeException("Customer must be at least 18 years old");
        }

        // Sauvegarde en base de données
        return customerRepository.save(customer);
    }

    /**
     * Récupère tous les clients
     */
    @Override
    @Transactional(readOnly = true)  // Optimisation pour les lectures seules
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    /**
     * Récupère un client par son ID
     * Lance une exception si non trouvé
     */
    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
    }

    /**
     * Met à jour un client existant
     */
    @Override
    public Customer updateCustomer(Long id, Customer customer) {
        // Vérifie que le client existe
        Customer existingCustomer = getCustomerById(id);

        // Vérification : si l'email change, il doit rester unique
        if (!existingCustomer.getEmail().equals(customer.getEmail()) &&
                customerRepository.existsByEmail(customer.getEmail())) {
            throw new RuntimeException("Email already exists: " + customer.getEmail());
        }

        // Vérification : si le téléphone change, il doit rester unique
        if (!existingCustomer.getPhoneNumber().equals(customer.getPhoneNumber()) &&
                customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new RuntimeException("Phone number already exists: " + customer.getPhoneNumber());
        }

        // Vérification : l'âge doit rester >= 18 ans
        if (customer.getAge() < 18) {
            throw new RuntimeException("Customer must be at least 18 years old");
        }

        // Mise à jour des champs (on garde l'ID et la date de création)
        existingCustomer.setLastName(customer.getLastName());
        existingCustomer.setFirstName(customer.getFirstName());
        existingCustomer.setDateOfBirth(customer.getDateOfBirth());
        existingCustomer.setGender(customer.getGender());
        existingCustomer.setAddress(customer.getAddress());
        existingCustomer.setPhoneNumber(customer.getPhoneNumber());
        existingCustomer.setEmail(customer.getEmail());
        existingCustomer.setNationality(customer.getNationality());

        return customerRepository.save(existingCustomer);
    }

    /**
     * Supprime un client
     * Supprime automatiquement tous ses comptes (cascade défini dans l'entité)
     */
    @Override
    public void deleteCustomer(Long id) {
        // Vérifie que le client existe
        Customer customer = getCustomerById(id);

        // Suppression
        customerRepository.delete(customer);
    }

    /**
     * Récupère un client par son email
     */
    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + email));
    }
}