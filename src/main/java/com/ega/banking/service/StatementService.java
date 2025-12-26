package com.ega.banking.service;

import java.time.LocalDateTime;

/**
 * Interface pour la génération de relevés bancaires
 */
public interface StatementService {

    /**
     * Génère un relevé bancaire au format PDF
     * @param accountId ID du compte
     * @param startDate Date de début de la période
     * @param endDate Date de fin de la période
     * @return Le PDF sous forme de tableau de bytes
     */
    byte[] generateStatementPdf(Long accountId, LocalDateTime startDate, LocalDateTime endDate);
}