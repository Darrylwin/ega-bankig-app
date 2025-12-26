package com.ega.banking.service;

import com.ega.banking.entity.Account;
import com.ega.banking.entity.AccountType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Interface définissant les opérations métier pour les comptes bancaires
 * Respecte le principe d'inversion de dépendances (SOLID)
 */
public interface AccountService {

    /**
     * Crée un nouveau compte bancaire
     * Génère automatiquement un numéro IBAN unique
     * Initialise le solde à 0
     * @param customerId L'ID du client propriétaire
     * @param accountType Le type de compte (SAVINGS ou CURRENT)
     * @param currency La devise (EUR, USD, XOF, etc.)
     * @return Le compte créé
     */
    Account createAccount(Long customerId, AccountType accountType, String currency);

    /**
     * Récupère tous les comptes (sans pagination)
     * @return Liste de tous les comptes
     */
    List<Account> getAllAccounts();

    /**
     * Récupère tous les comptes avec pagination
     * @param pageable Paramètres de pagination
     * @return Page de comptes
     */
    Page<Account> getAllAccounts(Pageable pageable);

    /**
     * Récupère un compte par son ID
     * @param id L'ID du compte
     * @return Le compte trouvé
     * @throws RuntimeException si le compte n'existe pas
     */
    Account getAccountById(Long id);

    /**
     * Récupère un compte par son numéro IBAN
     * @param accountNumber Le numéro IBAN
     * @return Le compte trouvé
     * @throws RuntimeException si le compte n'existe pas
     */
    Account getAccountByAccountNumber(String accountNumber);

    /**
     * Récupère tous les comptes d'un client
     * @param customerId L'ID du client
     * @return Liste des comptes du client
     */
    List<Account> getAccountsByCustomerId(Long customerId);

    /**
     * Supprime un compte
     * Supprime aussi toutes ses transactions (cascade)
     * @param id L'ID du compte à supprimer
     * @throws RuntimeException si le compte n'existe pas
     */
    void deleteAccount(Long id);

    /**
     * Génère un numéro IBAN unique
     * Utilise la librairie iban4j
     * @return Un numéro IBAN valide et unique
     */
    String generateUniqueIban();
}