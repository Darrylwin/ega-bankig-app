package com.ega.banking.exception;

/**
 * Exception levée quand une opération est invalide
 * (Virement vers le même compte, montant négatif, etc.)
 */
public class InvalidOperationException extends RuntimeException {

    public InvalidOperationException(String message) {
        super(message);
    }
}