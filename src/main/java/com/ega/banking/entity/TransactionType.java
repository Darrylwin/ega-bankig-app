package com.ega.banking.entity;

/**
 * Types d'opérations bancaires possibles
 */
public enum TransactionType {
    DEPOSIT,    // Dépôt d'argent
    WITHDRAWAL, // Retrait d'argent
    TRANSFER    // Virement entre comptes
}