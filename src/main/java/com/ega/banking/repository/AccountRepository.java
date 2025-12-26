package com.ega.banking.repository;

import com.ega.banking.entity.Account;
import com.ega.banking.entity.AccountType;
import com.ega.banking.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'entité Account
 * Fournit les méthodes pour accéder aux comptes bancaires
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    /**
     * Recherche un compte par son numéro IBAN
     * Spring génère : SELECT * FROM accounts WHERE account_number = ?
     * @param accountNumber Le numéro IBAN du compte
     * @return Optional contenant le compte si trouvé, vide sinon
     */
    Optional<Account> findByAccountNumber(String accountNumber);

    /**
     * Récupère tous les comptes d'un client
     * Spring génère : SELECT * FROM accounts WHERE customer_id = ?
     * @param customer Le client propriétaire
     * @return Liste des comptes du client
     */
    List<Account> findByCustomer(Customer customer);

    /**
     * Récupère tous les comptes d'un client par son ID
     * Spring génère : SELECT * FROM accounts WHERE customer_id = ?
     * @param customerId L'ID du client
     * @return Liste des comptes du client
     */
    List<Account> findByCustomerId(Long customerId);

    /**
     * Vérifie si un numéro de compte existe déjà
     * Spring génère : SELECT COUNT(*) > 0 FROM accounts WHERE account_number = ?
     * @param accountNumber Le numéro IBAN à vérifier
     * @return true si le numéro existe, false sinon
     */
    boolean existsByAccountNumber(String accountNumber);

    /**
     * Compte le nombre de comptes par type
     */
    Long countByAccountType(AccountType accountType);

    /**
     * Calcule la somme totale des soldes de tous les comptes
     */
    @Query("SELECT SUM(a.balance) FROM Account a")
    BigDecimal sumAllBalances();
}