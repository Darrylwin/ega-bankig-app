package com.ega.banking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un compte bancaire
 * CORRECTION : Relation avec Transaction mise à jour
 */
@Entity
@Table(name = "accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Numéro de compte au format IBAN
     * Unique pour chaque compte
     * Généré automatiquement avec la librairie iban4j
     */
    @NotBlank(message = "Account number is required")
    @Column(nullable = false, unique = true, length = 34)
    private String accountNumber;

    @NotNull(message = "Account type is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType accountType;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Solde du compte
     * BigDecimal est utilisé pour les calculs financiers précis
     * (évite les problèmes d'arrondi de float/double)
     * Initialisé à 0.00 lors de la création
     */
    @NotNull(message = "Balance is required")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    /**
     * Devise du compte (EUR, USD, XOF, etc.)
     */
    @NotBlank(message = "Currency is required")
    @Column(nullable = false, length = 3)
    private String currency = "EUR";

    @NotNull(message = "Account status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    /**
     * Relation Many-to-One : Plusieurs comptes peuvent appartenir à un client
     * Le client propriétaire du compte
     */
    @NotNull(message = "Customer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    /**
     * Relation avec Transaction
     * mappedBy correspond au nouveau nom "account" dans Transaction
     */
    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> transactions = new ArrayList<>();

    /**
     * Méthode appelée automatiquement AVANT l'insertion en base
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        // Le solde est déjà initialisé à 0 par défaut
        if (this.balance == null) {
            this.balance = BigDecimal.ZERO;
        }
        // Le statut est déjà initialisé à ACTIVE par défaut
        if (this.status == null) {
            this.status = AccountStatus.ACTIVE;
        }
    }

    /**
     * Vérifie si le compte est actif
     *
     * @return true si le compte est actif, false sinon
     */
    public boolean isActive() {
        return this.status == AccountStatus.ACTIVE;
    }

    /**
     * Vérifie si le solde est suffisant pour un retrait
     * @param amount Montant à retirer
     * @return true si le solde est suffisant, false sinon
     */
    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.balance.compareTo(amount) >= 0;
    }

    /**
     * Ajoute un montant au solde (pour les dépôts)
     *
     * @param amount Montant à ajouter
     */
    public void deposit(BigDecimal amount) {
        this.balance = this.balance.add(amount);
    }

    /**
     * Retire un montant du solde (pour les retraits)
     *
     * @param amount Montant à retirer
     */
    public void withdraw(BigDecimal amount) {
        this.balance = this.balance.subtract(amount);
    }
}