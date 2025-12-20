package com.ega.banking.exception;

/**
 * Exception levée quand on tente de créer un utilisateur qui existe déjà
 * (nom d'utilisateur ou email déjà utilisé)
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String fieldName, String fieldValue) {
        super(String.format("%s '%s' is already taken", fieldName, fieldValue));
    }
}