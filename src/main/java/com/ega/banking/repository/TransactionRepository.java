package com.ega.banking.repository;

import com.ega.banking.entity.Account;
import com.ega.banking.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Transaction
 * inclue les virements reçus
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionReference(String transactionReference);

    /**
     * Récupère toutes les transactions où le compte est l'account principal
     * Cela inclut les dépôts, retraits et virements ENVOYÉS
     */
    List<Transaction> findByAccountOrderByTransactionDateDesc(Account account);

    List<Transaction> findByAccountIdOrderByTransactionDateDesc(Long accountId);

    /**
     * Récupère TOUTES les transactions d'un compte
     * - Transactions où le compte est l'account principal (dépôts, retraits, virements envoyés)
     * - Transactions où le compte est la destination (virements reçus)
     */
    @Query("SELECT t FROM Transaction t WHERE t.account.id = :accountId " +
            "OR t.destinationAccount.id = :accountId " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findAllByAccountId(@Param("accountId") Long accountId);

    /**
     * Récupère TOUTES les transactions d'un compte sur une période
     * Inclut les virements reçus
     */
    @Query("SELECT t FROM Transaction t WHERE " +
            "(t.account.id = :accountId OR t.destinationAccount.id = :accountId) " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findByAccountAndDateBetween(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.transactionDate >= :startDate")
    Long countSinceDate(@Param("startDate") LocalDateTime startDate);

    /**
     * Calcule le total des dépôts depuis une certaine date
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType = 'DEPOSIT' AND t.transactionDate >= :startDate")
    java.math.BigDecimal sumDepositsSinceDate(@Param("startDate") LocalDateTime startDate);

    /**
     * Calcule le total des retraits depuis une certaine date
     */
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.transactionType IN ('WITHDRAWAL', 'TRANSFER') AND t.transactionDate >= :startDate")
    java.math.BigDecimal sumWithdrawalsSinceDate(@Param("startDate") LocalDateTime startDate);
}