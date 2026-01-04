package com.ega.banking.controller;

import com.ega.banking.dto.*;
import com.ega.banking.entity.Transaction;
import com.ega.banking.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Contrôleur REST pour gérer les transactions bancaires
 * Base URL : /api/transactions
 */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final TransactionMapper transactionMapper;

    /**
     * POST /api/transactions/deposit
     * Effectue un dépôt
     * Accessible aux ADMIN et USER
     */
    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<TransactionDTO> deposit(@Valid @RequestBody DepositRequestDTO request) {
        Transaction transaction = transactionService.deposit(
                request.getAccountId(),
                request.getAmount(),
                request.getDescription()
        );
        TransactionDTO response = transactionMapper.toDTO(transaction);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * POST /api/transactions/withdraw
     * Effectue un retrait
     * Accessible aux ADMIN et USER
     */
    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<TransactionDTO> withdraw(@Valid @RequestBody WithdrawalRequestDTO request) {
        Transaction transaction = transactionService.withdraw(
                request.getAccountId(),
                request.getAmount(),
                request.getDescription()
        );
        TransactionDTO response = transactionMapper.toDTO(transaction);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * POST /api/transactions/transfer
     * Effectue un virement
     * Accessible aux ADMIN et USER
     */
    @PostMapping("/transfer")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<TransactionDTO> transfer(@Valid @RequestBody TransferRequestDTO request) {
        Transaction transaction = transactionService.transfer(
                request.getSourceAccountId(),
                request.getDestinationAccountId(),
                request.getAmount(),
                request.getDescription()
        );
        TransactionDTO response = transactionMapper.toDTO(transaction);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * GET /api/transactions/account/{accountId}
     * Récupère toutes les transactions d'un compte
     * Accessible aux ADMIN et USER (propriétaire)
     */
    @GetMapping("/account/{accountId}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByAccountId(@PathVariable Long accountId) {
        List<Transaction> transactions = transactionService.getTransactionsByAccountId(accountId);
        List<TransactionDTO> response = transactions.stream()
                .map(transactionMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/transactions/account/{accountId}/period
     * Récupère les transactions d'un compte sur une période
     * Query params: startDate et endDate au format ISO (ex: 2026-01-01T00:00:00)
     * Accessible aux ADMIN et USER (propriétaire)
     */
    @GetMapping("/account/{accountId}/period")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByPeriod(
            @PathVariable Long accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<Transaction> transactions = transactionService.getTransactionsByAccountIdAndPeriod(
                accountId, startDate, endDate
        );
        List<TransactionDTO> response = transactions.stream()
                .map(transactionMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/transactions/{id}
     * Récupère une transaction par son ID
     * Accessible aux ADMIN et USER
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_USER')")
    public ResponseEntity<TransactionDTO> getTransactionById(@PathVariable Long id) {
        Transaction transaction = transactionService.getTransactionById(id);
        TransactionDTO response = transactionMapper.toDTO(transaction);
        return ResponseEntity.ok(response);
    }
}