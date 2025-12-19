package com.ega.banking.exception;

/**
 * Exception levée quand une ressource n'est pas trouvée
 * (Client, Compte, Transaction, etc.)
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
    }
}