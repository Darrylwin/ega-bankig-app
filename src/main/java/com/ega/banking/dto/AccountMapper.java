package com.ega.banking.dto;

import com.ega.banking.entity.Account;
import org.springframework.stereotype.Component;

/**
 * Mapper pour convertir entre Account et AccountDTO
 */
@Component
public class AccountMapper {

    /**
     * Convertit une entité Account en DTO
     */
    public AccountDTO toDTO(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setAccountType(account.getAccountType());
        dto.setCreatedAt(account.getCreatedAt());
        dto.setBalance(account.getBalance());
        dto.setCurrency(account.getCurrency());
        dto.setStatus(account.getStatus());
        dto.setCustomerId(account.getCustomer().getId());
        dto.setCustomerFullName(account.getCustomer().getFirstName() + " " +
                account.getCustomer().getLastName());
        return dto;
    }
}