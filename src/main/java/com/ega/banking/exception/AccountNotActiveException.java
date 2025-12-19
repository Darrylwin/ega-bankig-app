package com.ega.banking.exception;

/**
 * Exception levée quand on tente une opération sur un compte inactif
 */
public class AccountNotActiveException extends RuntimeException {

    public AccountNotActiveException(String accountNumber) {
        super(String.format("Account is not active: %s", accountNumber));
    }
}