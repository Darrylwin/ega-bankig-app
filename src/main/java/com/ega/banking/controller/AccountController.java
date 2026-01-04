package com.ega.banking.controller;

import com.ega.banking.dto.AccountDTO;
import com.ega.banking.dto.AccountMapper;
import com.ega.banking.dto.AccountRequestDTO;
import com.ega.banking.entity.Account;
import com.ega.banking.service.AccountService;
import com.ega.banking.service.StatementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    private final StatementService statementService;

    /**
     * POST /api/accounts
     * Crée un nouveau compte
     * Accessible uniquement aux ADMIN
     */
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
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
     * Récupère tous les comptes avec pagination
     * Query params: page, size, sort
     * Accessible uniquement aux ADMIN
     */
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<AccountDTO>> getAllAccounts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,asc") String[] sort) {

        // Créer l'objet Pageable
        org.springframework.data.domain.Sort.Direction direction = sort[1].equalsIgnoreCase("desc")
                ? org.springframework.data.domain.Sort.Direction.DESC
                : org.springframework.data.domain.Sort.Direction.ASC;
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, size, org.springframework.data.domain.Sort.by(direction, sort[0]));

        // Récupérer la page de comptes
        org.springframework.data.domain.Page<Account> accountsPage = accountService.getAllAccounts(pageable);

        // Convertir en DTOs
        org.springframework.data.domain.Page<AccountDTO> response = accountsPage.map(accountMapper::toDTO);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/accounts/{id}
     * Récupère un compte par son ID
     * Accessible aux ADMIN et USER (propriétaire)
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
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
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
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
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
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
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/accounts/{accountId}/statement
     * Génère et télécharge un relevé bancaire au format PDF
     * Query params: startDate et endDate au format ISO (2026-01-01T00:00:00)
     * Accessible aux ADMIN et USER (propriétaire du compte)
     */
    @GetMapping("/{accountId}/statement")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<byte[]> generateStatement(
            @PathVariable Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        // Génère le PDF
        byte[] pdfBytes = statementService.generateStatementPdf(accountId, startDate, endDate);

        // Prépare les headers pour le téléchargement
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "releve_" + accountId + "_" + System.currentTimeMillis() + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}