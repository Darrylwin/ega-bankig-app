package com.ega.banking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entité représentant une transaction bancaire
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Transaction type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    /**
     * Montant de la transaction
     * Doit être positif (> 0)
     */
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, updatable = false)
    private LocalDateTime transactionDate;

    /**
     * Description facultative de la transaction
     */
    @Column(length = 500)
    private String description;

    /**
     * Compte principal concerné par la transaction
     * - Pour DEPOSIT : compte qui reçoit l'argent
     * - Pour WITHDRAWAL : compte qui perd l'argent
     * - Pour TRANSFER : compte qui envoie l'argent (débité)
     */
    @NotNull(message = "Account is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    /**
     * Compte destination (uniquement pour les virements)
     * NULL pour les dépôts et retraits
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_account_id")
    private Account destinationAccount;

    /**
     * Référence unique de la transaction
     * Générée automatiquement (ex: TRX202601181234567890)
     */
    @Column(nullable = false, unique = true, length = 50)
    private String transactionReference;

    @NotNull(message = "Transaction status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status = TransactionStatus.PENDING;

    /**
     * Solde du compte principal AVANT la transaction
     */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceBefore;

    /**
     * Solde du compte principal APRÈS la transaction
     */
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balanceAfter;

    /**
     * Pour les virements : solde du compte destination AVANT
     */
    @Column(precision = 19, scale = 2)
    private BigDecimal destinationBalanceBefore;

    /**
     * Pour les virements : solde du compte destination APRÈS
     */
    @Column(precision = 19, scale = 2)
    private BigDecimal destinationBalanceAfter;

    /**
     * Méthode appelée automatiquement AVANT l'insertion en base
     */
    @PrePersist
    protected void onCreate() {
        this.transactionDate = LocalDateTime.now();
        // Génère une référence unique si elle n'existe pas
        if (this.transactionReference == null) {
            this.transactionReference = generateTransactionReference();
        }
        // Statut par défaut : PENDING
        if (this.status == null) {
            this.status = TransactionStatus.PENDING;
        }
    }

    /**
     * Génère une référence unique pour la transaction
     * Format : TRX + timestamp + 4 chiffres aléatoires
     * Exemple : TRX20260118123456789012
     * @return La référence générée
     */
    private String generateTransactionReference() {
        long timestamp = System.currentTimeMillis();
        int random = (int) (Math.random() * 10000);
        return String.format("TRX%d%04d", timestamp, random);
    }
}