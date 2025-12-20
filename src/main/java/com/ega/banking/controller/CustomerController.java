package com.ega.banking.controller;

import com.ega.banking.dto.CustomerDTO;
import com.ega.banking.dto.CustomerMapper;
import com.ega.banking.dto.CustomerRequestDTO;
import com.ega.banking.entity.Customer;
import com.ega.banking.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour gérer les clients
 * Base URL : /api/customers
 */
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final CustomerMapper customerMapper;

    /**
     * POST /api/customers
     * Crée un nouveau client
     * Accessible uniquement aux ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerRequestDTO request) {
        Customer customer = customerMapper.toEntity(request);
        Customer savedCustomer = customerService.createCustomer(customer);
        CustomerDTO response = customerMapper.toDTO(savedCustomer);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * GET /api/customers
     * Récupère tous les clients
     * Accessible uniquement aux ADMIN
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerDTO>> getAllCustomers() {
        List<Customer> customers = customerService.getAllCustomers();
        List<CustomerDTO> response = customers.stream()
                .map(customerMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/customers/{id}
     * Récupère un client par son ID
     * Accessible aux ADMIN et USER (propriétaire uniquement)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        Customer customer = customerService.getCustomerById(id);
        CustomerDTO response = customerMapper.toDTO(customer);
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/customers/{id}
     * Met à jour un client
     * Accessible uniquement aux ADMIN
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerDTO> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequestDTO request) {
        Customer customer = customerMapper.toEntity(request);
        Customer updatedCustomer = customerService.updateCustomer(id, customer);
        CustomerDTO response = customerMapper.toDTO(updatedCustomer);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/customers/{id}
     * Supprime un client
     * Accessible uniquement aux ADMIN
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/customers/email/{email}
     * Recherche un client par email
     * Accessible uniquement aux ADMIN
     */
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CustomerDTO> getCustomerByEmail(@PathVariable String email) {
        Customer customer = customerService.getCustomerByEmail(email);
        CustomerDTO response = customerMapper.toDTO(customer);
        return ResponseEntity.ok(response);
    }
}