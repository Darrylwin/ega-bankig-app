package com.ega.banking.service;

import com.ega.banking.entity.Customer;
import com.ega.banking.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implémentation du service Customer
 * CORRECTION : Suppression de la validation d'âge minimum
 * Un client peut être créé quel que soit son âge (pour permettre comptes épargne mineurs)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;

    /**
     * Crée un nouveau client après validation
     */
    @Override
    public Customer createCustomer(Customer customer) {
        // Vérification : l'email doit être unique
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new com.ega.banking.exception.DuplicateResourceException("Email", customer.getEmail());
        }

        // Vérification : le téléphone doit être unique
        if (customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new com.ega.banking.exception.DuplicateResourceException("Phone number", customer.getPhoneNumber());
        }

        // Sauvegarde en base de données
        return customerRepository.save(customer);
    }

    /**
     * Récupère tous les clients
     */
    @Override
    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    /**
     * Récupère tous les clients avec pagination
     */
    @Transactional(readOnly = true)
    @Override
    public org.springframework.data.domain.Page<Customer> getAllCustomers(org.springframework.data.domain.Pageable pageable) {
        return customerRepository.findAll(pageable);
    }

    /**
     * Récupère un client par son ID
     * Lance une exception si non trouvé
     */
    @Override
    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new com.ega.banking.exception.ResourceNotFoundException("Customer", "id", id));
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
            throw new com.ega.banking.exception.DuplicateResourceException("Email", customer.getEmail());
        }

        // Vérification : si le téléphone change, il doit rester unique
        if (!existingCustomer.getPhoneNumber().equals(customer.getPhoneNumber()) &&
                customerRepository.existsByPhoneNumber(customer.getPhoneNumber())) {
            throw new com.ega.banking.exception.DuplicateResourceException("Phone number", customer.getPhoneNumber());
        }

        // Suppression de la vérification d'âge
        // Permet de mettre à jour un client sans restriction d'âge

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
                .orElseThrow(() -> new com.ega.banking.exception.ResourceNotFoundException("Customer", "email", email));
    }
}