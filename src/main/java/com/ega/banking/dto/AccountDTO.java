package com.ega.banking.dto;

import com.ega.banking.entity.AccountStatus;
import com.ega.banking.entity.AccountType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO pour transférer les données d'un compte
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {

    private Long id;
    private String accountNumber;
    private AccountType accountType;
    private LocalDateTime createdAt;
    private BigDecimal balance;
    private String currency;
    private AccountStatus status;
    private Long customerId;  // Référence au client
    private String customerFullName;  // Nom complet du client (pour l'affichage)
}