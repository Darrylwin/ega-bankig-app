package com.ega.banking.exception;

/**
 * Exception levée quand un rôle n'est pas trouvé dans la base
 */
public class RoleNotFoundException extends RuntimeException {

    public RoleNotFoundException(String roleName) {
        super(String.format("Role '%s' not found in database", roleName));
    }
}