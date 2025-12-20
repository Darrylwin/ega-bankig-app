package com.ega.banking.controller;

import com.ega.banking.dto.AccountDTO;
import com.ega.banking.dto.AccountMapper;
import com.ega.banking.dto.AccountRequestDTO;
import com.ega.banking.entity.Account;
import com.ega.banking.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour gérer les comptes bancaires
 * Base URL : /api/accounts
 */
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AccountMapper accountMapper;

    /**
     * POST /api/accounts
     * Crée un nouveau compte
     * Accessible uniquement aux ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AccountDTO> createAccount(@Valid @RequestBody AccountRequestDTO request) {
        Account account = accountService.createAccount(
                request.getCustomerId(),
                request.getAccountType(),
                request.getCurrency()
        );
        AccountDTO response = accountMapper.toDTO(account);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * GET /api/accounts
     * Récupère tous les comptes
     * Accessible uniquement aux ADMIN
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AccountDTO>> getAllAccounts() {
        List<Account> accounts = accountService.getAllAccounts();
        List<AccountDTO> response = accounts.stream()
                .map(accountMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/accounts/{id}
     * Récupère un compte par son ID
     * Accessible aux ADMIN et USER (propriétaire)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<AccountDTO> getAccountById(@PathVariable Long id) {
        Account account = accountService.getAccountById(id);
        AccountDTO response = accountMapper.toDTO(account);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/accounts/number/{accountNumber}
     * Recherche un compte par son numéro IBAN
     * Accessible aux ADMIN et USER
     */
    @GetMapping("/number/{accountNumber}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<AccountDTO> getAccountByNumber(@PathVariable String accountNumber) {
        Account account = accountService.getAccountByAccountNumber(accountNumber);
        AccountDTO response = accountMapper.toDTO(account);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/accounts/customer/{customerId}
     * Récupère tous les comptes d'un client
     * Accessible aux ADMIN et USER (propriétaire)
     */
    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('USER')")
    public ResponseEntity<List<AccountDTO>> getAccountsByCustomerId(@PathVariable Long customerId) {
        List<Account> accounts = accountService.getAccountsByCustomerId(customerId);
        List<AccountDTO> response = accounts.stream()
                .map(accountMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/accounts/{id}
     * Supprime un compte
     * Accessible uniquement aux ADMIN
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}