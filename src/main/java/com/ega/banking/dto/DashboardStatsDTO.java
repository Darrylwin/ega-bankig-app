package com.ega.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO contenant les statistiques du dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {

    // Statistiques générales
    private Long totalCustomers;
    private Long totalAccounts;
    private Long totalTransactions;
    private BigDecimal totalBalance;  // Somme des soldes de tous les comptes

    // Statistiques par type de compte
    private Long savingsAccountsCount;
    private Long currentAccountsCount;

    // Statistiques du jour
    private Long transactionsToday;
    private BigDecimal depositsToday;
    private BigDecimal withdrawalsToday;

    // Statistiques de la semaine
    private Long transactionsThisWeek;
    private BigDecimal depositsThisWeek;
    private BigDecimal withdrawalsThisWeek;

    // Statistiques du mois
    private Long transactionsThisMonth;
    private BigDecimal depositsThisMonth;
    private BigDecimal withdrawalsThisMonth;
}