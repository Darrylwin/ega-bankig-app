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
 * Fournit les méthodes pour accéder aux transactions bancaires
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    /**
     * Recherche une transaction par sa référence unique
     * Spring génère : SELECT * FROM transactions WHERE transaction_reference = ?
     * @param transactionReference La référence de la transaction
     * @return Optional contenant la transaction si trouvée, vide sinon
     */
    Optional<Transaction> findByTransactionReference(String transactionReference);

    /**
     * Récupère toutes les transactions d'un compte
     * Ordonnées par date décroissante (les plus récentes en premier)
     * Spring génère : SELECT * FROM transactions
     *                 WHERE source_account_id = ?
     *                 ORDER BY transaction_date DESC
     * @param sourceAccount Le compte source
     * @return Liste des transactions du compte
     */
    List<Transaction> findBySourceAccountOrderByTransactionDateDesc(Account sourceAccount);

    /**
     * Récupère toutes les transactions d'un compte par son ID
     * @param accountId L'ID du compte
     * @return Liste des transactions
     */
    List<Transaction> findBySourceAccountIdOrderByTransactionDateDesc(Long accountId);

    /**
     * Récupère les transactions d'un compte sur une période donnée
     * Utilise une requête JPQL personnalisée
     * @param accountId L'ID du compte
     * @param startDate Date de début de la période
     * @param endDate Date de fin de la période
     * @return Liste des transactions dans la période
     */
    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount.id = :accountId " +
            "AND t.transactionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findByAccountAndDateBetween(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * Récupère toutes les transactions où un compte est source OU destination
     * Utile pour voir l'historique complet d'un compte (virements reçus inclus)
     * @param sourceAccountId ID du compte source
     * @param destinationAccountId ID du compte destination
     * @return Liste complète des transactions
     */
    @Query("SELECT t FROM Transaction t WHERE t.sourceAccount.id = :accountId " +
            "OR t.destinationAccount.id = :accountId " +
            "ORDER BY t.transactionDate DESC")
    List<Transaction> findAllByAccountId(@Param("accountId") Long accountId);
}