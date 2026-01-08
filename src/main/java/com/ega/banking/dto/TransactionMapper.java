package com.ega.banking.dto;

import com.ega.banking.entity.Transaction;
import org.springframework.stereotype.Component;

/**
 * Mapper pour convertir entre Transaction et TransactionDTO
 */
@Component
public class TransactionMapper {

    /**
     * Convertit une entité Transaction en DTO
     */
    public TransactionDTO toDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setTransactionType(transaction.getTransactionType());
        dto.setAmount(transaction.getAmount());
        dto.setTransactionDate(transaction.getTransactionDate());
        dto.setDescription(transaction.getDescription());
        dto.setSourceAccountNumber(transaction.getAccount().getAccountNumber());

        // Le compte destination est null pour les dépôts et retraits
        if (transaction.getDestinationAccount() != null) {
            dto.setDestinationAccountNumber(transaction.getDestinationAccount().getAccountNumber());
        }

        dto.setTransactionReference(transaction.getTransactionReference());
        dto.setStatus(transaction.getStatus());
        dto.setBalanceBefore(transaction.getBalanceBefore());
        dto.setBalanceAfter(transaction.getBalanceAfter());

        return dto;
    }
}