package com.ega.banking.exception;

/**
 * Exception levée quand l'authentification échoue
 * (mauvais identifiants, compte désactivé, etc.)
 */
public class AuthenticationFailedException extends RuntimeException {

    public AuthenticationFailedException(String message) {
        super(message);
    }
}