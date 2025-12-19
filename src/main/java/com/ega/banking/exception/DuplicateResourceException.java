package com.ega.banking.exception;

/**
 * Exception levée quand on tente de créer une ressource qui existe déjà
 * (Email en double, téléphone en double, etc.)
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String fieldName, Object fieldValue) {
        super(String.format("%s already exists: %s", fieldName, fieldValue));
    }
}