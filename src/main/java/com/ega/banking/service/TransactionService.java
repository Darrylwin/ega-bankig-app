package com.ega.banking.service;

import com.ega.banking.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Interface définissant les opérations métier pour les transactions bancaires
 * Respecte le principe d'inversion de dépendances (SOLID)
 */
public interface TransactionService {

    /**
     * Effectue un dépôt sur un compte
     * Ajoute le montant au solde du compte
     * @param accountId L'ID du compte qui reçoit l'argent
     * @param amount Le montant à déposer (doit être > 0)
     * @param description Description facultative
     * @return La transaction créée
     * @throws RuntimeException si le compte n'existe pas, n'est pas actif, ou si le montant est invalide
     */
    Transaction deposit(Long accountId, BigDecimal amount, String description);

    /**
     * Effectue un retrait sur un compte
     * Retire le montant du solde du compte
     * @param accountId L'ID du compte qui perd l'argent
     * @param amount Le montant à retirer (doit être > 0)
     * @param description Description facultative
     * @return La transaction créée
     * @throws RuntimeException si le compte n'existe pas, n'est pas actif, le solde est insuffisant, ou le montant est invalide
     */
    Transaction withdraw(Long accountId, BigDecimal amount, String description);

    /**
     * Effectue un virement d'un compte vers un autre
     * Retire le montant du compte source et l'ajoute au compte destination
     * Opération atomique : si une partie échoue, tout est annulé (rollback)
     * @param sourceAccountId L'ID du compte qui envoie l'argent
     * @param destinationAccountId L'ID du compte qui reçoit l'argent
     * @param amount Le montant à transférer (doit être > 0)
     * @param description Description facultative
     * @return La transaction de virement créée
     * @throws RuntimeException si un compte n'existe pas, n'est pas actif, le solde est insuffisant, les comptes sont identiques, ou le montant est invalide
     */
    Transaction transfer(Long sourceAccountId, Long destinationAccountId, BigDecimal amount, String description);

    /**
     * Récupère toutes les transactions d'un compte
     * Ordonnées par date décroissante (les plus récentes en premier)
     * @param accountId L'ID du compte
     * @return Liste des transactions
     */
    List<Transaction> getTransactionsByAccountId(Long accountId);

    /**
     * Récupère les transactions d'un compte sur une période donnée
     * Utilisé pour générer les relevés bancaires
     * @param accountId L'ID du compte
     * @param startDate Date de début de la période
     * @param endDate Date de fin de la période
     * @return Liste des transactions dans la période
     */
    List<Transaction> getTransactionsByAccountIdAndPeriod(Long accountId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Récupère une transaction par son ID
     * @param id L'ID de la transaction
     * @return La transaction trouvée
     * @throws RuntimeException si la transaction n'existe pas
     */
    Transaction getTransactionById(Long id);
}