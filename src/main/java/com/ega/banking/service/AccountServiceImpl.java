package com.ega.banking.service;

import com.ega.banking.entity.Account;
import com.ega.banking.entity.AccountStatus;
import com.ega.banking.entity.AccountType;
import com.ega.banking.entity.Customer;
import com.ega.banking.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.iban4j.CountryCode;
import org.iban4j.Iban;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Implémentation du service Account
 * validation d'âge selon le type de compte
 * - CURRENT : nécessite 18 ans minimum
 * - SAVINGS : aucune restriction d'âge
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final CustomerService customerService;

    /**
     * Crée un nouveau compte bancaire avec un IBAN généré
     */
    @Override
    public Account createAccount(Long customerId, AccountType accountType, String currency) {
        // Récupère le client (lance une exception si non trouvé)
        Customer customer = customerService.getCustomerById(customerId);

        // Validation d'âge selon le type de compte
        if (accountType == AccountType.CURRENT && customer.getAge() < 18) {
            throw new com.ega.banking.exception.InvalidOperationException(
                    "A current account requires the customer to be at least 18 years old. " +
                            "Customers under 18 can only open savings accounts.");
        }

        // Aucune restriction pour SAVINGS → OK pour tous les âges

        String iban = generateUniqueIban();

        // Crée le compte
        Account account = new Account();
        account.setAccountNumber(iban);
        account.setAccountType(accountType);
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency(currency);
        account.setStatus(AccountStatus.ACTIVE);
        account.setCustomer(customer);

        // Sauvegarde en base
        return accountRepository.save(account);
    }

    /**
     * Récupère tous les comptes
     */
    @Override
    @Transactional(readOnly = true)
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    /**
     * Récupère tous les comptes avec pagination
     */
    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Account> getAllAccounts(org.springframework.data.domain.Pageable pageable) {
        return accountRepository.findAll(pageable);
    }

    /**
     * Récupère un compte par son ID
     */
    @Override
    @Transactional(readOnly = true)
    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new com.ega.banking.exception.ResourceNotFoundException(
                        "Account", "id", id));
    }

    /**
     * Récupère un compte par son numéro IBAN
     */
    @Override
    @Transactional(readOnly = true)
    public Account getAccountByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new com.ega.banking.exception.ResourceNotFoundException(
                        "Account", "accountNumber", accountNumber));
    }

    /**
     * Récupère tous les comptes d'un client
     */
    @Override
    @Transactional(readOnly = true)
    public List<Account> getAccountsByCustomerId(Long customerId) {
        // Vérifie que le client existe
        customerService.getCustomerById(customerId);

        return accountRepository.findByCustomerId(customerId);
    }

    /**
     * Supprime un compte
     */
    @Override
    public void deleteAccount(Long id) {
        Account account = getAccountById(id);
        accountRepository.delete(account);
    }

    /**
     * Génère un IBAN unique en utilisant iban4j
     * Boucle jusqu'à trouver un IBAN qui n'existe pas déjà
     */
    @Override
    public String generateUniqueIban() {
        String iban;
        int attempts = 0;
        int maxAttempts = 10;

        do {
            // Génère un IBAN français aléatoire
            iban = new Iban.Builder()
                    .countryCode(CountryCode.FR)
                    .bankCode("12345")
                    .branchCode("67890")
                    .accountNumber(String.format("%011d", (long) (Math.random() * 100000000000L)))
                    .nationalCheckDigit(String.format("%02d", (int) (Math.random() * 100)))
                    .build()
                    .toString();

            attempts++;

            // Sécurité : évite une boucle infinie
            if (attempts >= maxAttempts) {
                throw new com.ega.banking.exception.InvalidOperationException(
                        "Unable to generate unique IBAN after " + maxAttempts + " attempts");
            }

        } while (accountRepository.existsByAccountNumber(iban));

        return iban;
    }
}