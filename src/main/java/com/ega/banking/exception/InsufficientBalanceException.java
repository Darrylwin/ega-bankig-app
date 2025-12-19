package com.ega.banking.exception;

import java.math.BigDecimal;

/**
 * Exception levée quand le solde est insuffisant pour une opération
 */
public class InsufficientBalanceException extends RuntimeException {

    public InsufficientBalanceException(BigDecimal available, BigDecimal required) {
        super(String.format("Insufficient balance. Available: %s, Required: %s",
                available, required));
    }

    public InsufficientBalanceException(String message) {
        super(message);
    }
}