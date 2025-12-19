package com.ega.banking.service;

import com.ega.banking.entity.*;
import com.ega.banking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Implémentation du service Transaction
 * Gère toute la logique métier des opérations bancaires
 */
@Service
@RequiredArgsConstructor
@Transactional  // Très important : assure l'atomicité des transactions (rollback automatique en cas d'erreur)
public class TransactionServiceImpl implements TransactionService {

    // Injection de dépendances
    private final TransactionRepository transactionRepository;
    private final AccountService accountService;

    /**
     * Effectue un dépôt sur un compte
     */
    @Override
    public Transaction deposit(Long accountId, BigDecimal amount, String description) {
        // Validation : le montant doit être positif
        validateAmount(amount);

        // Récupère le compte et vérifie qu'il est actif
        Account account = accountService.getAccountById(accountId);
        validateAccountIsActive(account);

        // Enregistre le solde avant la transaction
        BigDecimal balanceBefore = account.getBalance();

        // Ajoute le montant au solde
        account.deposit(amount);

        // Crée la transaction
        Transaction transaction = new Transaction();
        transaction.setTransactionType(TransactionType.DEPOSIT);
        transaction.setAmount(amount);
        transaction.setDescription(description);
        transaction.setSourceAccount(account);
        transaction.setDestinationAccount(null);  // Pas de destination pour un dépôt
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(account.getBalance());
        transaction.setStatus(TransactionStatus.SUCCESS);

        // Sauvegarde la transaction
        return transactionRepository.save(transaction);
    }

    /**
     * Effectue un retrait sur un compte
     */
    @Override
    public Transaction withdraw(Long accountId, BigDecimal amount, String description) {
        // Validation : le montant doit être positif
        validateAmount(amount);

        // Récupère le compte et vérifie qu'il est actif
        Account account = accountService.getAccountById(accountId);
        validateAccountIsActive(account);

        // Vérifie que le solde est suffisant
        if (!account.hasSufficientBalance(amount)) {
            throw new com.ega.banking.exception.InsufficientBalanceException(
                    account.getBalance(), amount);
        }

        // Enregistre le solde avant la transaction
        BigDecimal balanceBefore = account.getBalance();

        // Retire le montant du solde
        account.withdraw(amount);

        // Crée la transaction
        Transaction transaction = new Transaction();
        transaction.setTransactionType(TransactionType.WITHDRAWAL);
        transaction.setAmount(amount);
        transaction.setDescription(description);
        transaction.setSourceAccount(account);
        transaction.setDestinationAccount(null);
        transaction.setBalanceBefore(balanceBefore);
        transaction.setBalanceAfter(account.getBalance());
        transaction.setStatus(TransactionStatus.SUCCESS);

        return transactionRepository.save(transaction);
    }

    /**
     * Effectue un virement d'un compte vers un autre
     * Opération atomique grâce à @Transactional
     */
    @Override
    public Transaction transfer(Long sourceAccountId, Long destinationAccountId,
                                BigDecimal amount, String description) {
        // Validation : le montant doit être positif
        validateAmount(amount);

        // Validation : les comptes doivent être différents
        if (sourceAccountId.equals(destinationAccountId)) {
            throw new com.ega.banking.exception.InvalidOperationException(
                    "Source and destination accounts must be different");
        }

        // Récupère les deux comptes
        Account sourceAccount = accountService.getAccountById(sourceAccountId);
        Account destinationAccount = accountService.getAccountById(destinationAccountId);

        // Vérifie que les deux comptes sont actifs
        validateAccountIsActive(sourceAccount);
        validateAccountIsActive(destinationAccount);

        // Vérifie que le compte source a assez d'argent
        if (!sourceAccount.hasSufficientBalance(amount)) {
            throw new com.ega.banking.exception.InsufficientBalanceException(
                    sourceAccount.getBalance(), amount);
        }

        // Enregistre les soldes avant la transaction
        BigDecimal sourceBalanceBefore = sourceAccount.getBalance();
        BigDecimal destinationBalanceBefore = destinationAccount.getBalance();

        // Effectue le virement (retire du source, ajoute au destination)
        sourceAccount.withdraw(amount);
        destinationAccount.deposit(amount);

        // Crée la transaction principale (du point de vue du compte source)
        Transaction transaction = new Transaction();
        transaction.setTransactionType(TransactionType.TRANSFER);
        transaction.setAmount(amount);
        transaction.setDescription(description);
        transaction.setSourceAccount(sourceAccount);
        transaction.setDestinationAccount(destinationAccount);
        transaction.setBalanceBefore(sourceBalanceBefore);
        transaction.setBalanceAfter(sourceAccount.getBalance());
        transaction.setStatus(TransactionStatus.SUCCESS);

        // Sauvegarde la transaction
        // Note : On pourrait créer une deuxième transaction pour le compte destination
        // mais le cahier des charges demande simplement d'enregistrer la transaction
        return transactionRepository.save(transaction);
    }

    /**
     * Récupère toutes les transactions d'un compte
     */
    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByAccountId(Long accountId) {
        // Vérifie que le compte existe
        accountService.getAccountById(accountId);

        return transactionRepository.findBySourceAccountIdOrderByTransactionDateDesc(accountId);
    }

    /**
     * Récupère les transactions d'un compte sur une période
     * Utilisé pour les relevés bancaires
     */
    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactionsByAccountIdAndPeriod(Long accountId,
                                                                 LocalDateTime startDate,
                                                                 LocalDateTime endDate) {
        // Vérifie que le compte existe
        accountService.getAccountById(accountId);

        // Validation : la date de début doit être avant la date de fin
        if (startDate.isAfter(endDate)) {
            throw new com.ega.banking.exception.InvalidOperationException(
                    "Start date must be before end date");
        }

        return transactionRepository.findByAccountAndDateBetween(accountId, startDate, endDate);
    }

    /**
     * Récupère une transaction par son ID
     */
    @Override
    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new com.ega.banking.exception.ResourceNotFoundException(
                        "Transaction", "id", id));
    }

    /**
     * Méthode utilitaire : valide qu'un montant est positif
     */
    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new com.ega.banking.exception.InvalidOperationException("Amount must be greater than 0");
        }
    }

    /**
     * Méthode utilitaire : valide qu'un compte est actif
     */
    private void validateAccountIsActive(Account account) {
        if (!account.isActive()) {
            throw new com.ega.banking.exception.AccountNotActiveException(account.getAccountNumber());
        }
    }
}