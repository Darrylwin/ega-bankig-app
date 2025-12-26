package com.ega.banking.service;

import com.ega.banking.dto.DashboardStatsDTO;
import com.ega.banking.entity.AccountType;
import com.ega.banking.repository.AccountRepository;
import com.ega.banking.repository.CustomerRepository;
import com.ega.banking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service pour calculer les statistiques du dashboard
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Calcule toutes les statistiques pour le dashboard
     */
    public DashboardStatsDTO getDashboardStats() {
        DashboardStatsDTO stats = new DashboardStatsDTO();

        // Statistiques générales
        stats.setTotalCustomers(customerRepository.count());
        stats.setTotalAccounts(accountRepository.count());
        stats.setTotalTransactions(transactionRepository.count());

        BigDecimal totalBalance = accountRepository.sumAllBalances();
        stats.setTotalBalance(totalBalance != null ? totalBalance : BigDecimal.ZERO);

        // Statistiques par type de compte
        stats.setSavingsAccountsCount(accountRepository.countByAccountType(AccountType.SAVINGS));
        stats.setCurrentAccountsCount(accountRepository.countByAccountType(AccountType.CURRENT));

        // Début du jour, de la semaine et du mois
        LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime startOfWeek = LocalDateTime.now().minusWeeks(1);
        LocalDateTime startOfMonth = LocalDateTime.now().minusMonths(1);

        // Statistiques du jour
        stats.setTransactionsToday(transactionRepository.countSinceDate(startOfToday));
        stats.setDepositsToday(transactionRepository.sumDepositsSinceDate(startOfToday));
        stats.setWithdrawalsToday(transactionRepository.sumWithdrawalsSinceDate(startOfToday));

        // Statistiques de la semaine
        stats.setTransactionsThisWeek(transactionRepository.countSinceDate(startOfWeek));
        stats.setDepositsThisWeek(transactionRepository.sumDepositsSinceDate(startOfWeek));
        stats.setWithdrawalsThisWeek(transactionRepository.sumWithdrawalsSinceDate(startOfWeek));

        // Statistiques du mois
        stats.setTransactionsThisMonth(transactionRepository.countSinceDate(startOfMonth));
        stats.setDepositsThisMonth(transactionRepository.sumDepositsSinceDate(startOfMonth));
        stats.setWithdrawalsThisMonth(transactionRepository.sumWithdrawalsSinceDate(startOfMonth));

        return stats;
    }
}