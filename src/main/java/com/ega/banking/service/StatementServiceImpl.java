package com.ega.banking.service;

import com.ega.banking.entity.Account;
import com.ega.banking.entity.Transaction;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Implémentation du service de génération de relevés bancaires
 * Utilise la requête qui inclut TOUS les types de transactions
 * (y compris les virements reçus)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatementServiceImpl implements StatementService {

    private final AccountService accountService;
    private final TransactionService transactionService;

    /**
     * Génère un relevé bancaire au format PDF
     */
    @Override
    public byte[] generateStatementPdf(Long accountId, LocalDateTime startDate, LocalDateTime endDate) {
        // Récupère le compte
        Account account = accountService.getAccountById(accountId);

        // Cette méthode utilise la requête qui inclu TOUTES les transactions (virements reçus compris)
        List<Transaction> transactions = transactionService.getTransactionsByAccountIdAndPeriod(
                accountId, startDate, endDate);

        // Génère le PDF
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Formateur de dates
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            // En-tête du relevé
            document.add(new Paragraph("EGA BANK")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("RELEVÉ BANCAIRE")
                    .setFontSize(16)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Informations du compte
            document.add(new Paragraph("Informations du compte").setBold().setFontSize(12));
            document.add(new Paragraph("Numéro de compte : " + account.getAccountNumber()));
            document.add(new Paragraph("Type : " + account.getAccountType()));
            document.add(new Paragraph("Titulaire : " + account.getCustomer().getFirstName() + " " +
                    account.getCustomer().getLastName()));
            document.add(new Paragraph("Période : Du " + startDate.format(formatter) + " au " +
                    endDate.format(formatter)));
            document.add(new Paragraph("Solde actuel : " + account.getBalance() + " " + account.getCurrency())
                    .setMarginBottom(20));

            // Calcul des totaux
            BigDecimal totalDeposits = BigDecimal.ZERO;
            BigDecimal totalWithdrawals = BigDecimal.ZERO;
            BigDecimal totalTransfersIn = BigDecimal.ZERO;
            BigDecimal totalTransfersOut = BigDecimal.ZERO;

            // CORRECTION : Calcul des totaux en tenant compte des virements reçus
            for (Transaction t : transactions) {
                // Si c'est une transaction où notre compte est l'account principal
                if (t.getAccount().getId().equals(accountId)) {
                    switch (t.getTransactionType()) {
                        case DEPOSIT:
                            totalDeposits = totalDeposits.add(t.getAmount());
                            break;
                        case WITHDRAWAL:
                            totalWithdrawals = totalWithdrawals.add(t.getAmount());
                            break;
                        case TRANSFER:
                            totalTransfersOut = totalTransfersOut.add(t.getAmount());
                            break;
                    }
                } else {
                    // C'est un virement reçu (notre compte est destinationAccount)
                    totalTransfersIn = totalTransfersIn.add(t.getAmount());
                }
            }

            // Tableau des transactions
            document.add(new Paragraph("Transactions").setBold().setFontSize(12));

            Table table = new Table(new float[]{2, 3, 2, 2, 2});
            table.setWidth(500);

            // En-têtes du tableau
            table.addHeaderCell("Date");
            table.addHeaderCell("Description");
            table.addHeaderCell("Type");
            table.addHeaderCell("Montant");
            table.addHeaderCell("Solde");

            // Lignes du tableau
            for (Transaction t : transactions) {
                table.addCell(t.getTransactionDate().format(formatter));
                table.addCell(t.getDescription() != null ? t.getDescription() : "-");

                // Affichage adapté selon si c'est un virement reçu ou envoyé
                boolean isIncoming = !t.getAccount().getId().equals(accountId);
                String typeDisplay = t.getTransactionType().toString();
                if (isIncoming) {
                    typeDisplay = "TRANSFER (Reçu)";
                }
                table.addCell(typeDisplay);

                String sign = (t.getTransactionType() == com.ega.banking.entity.TransactionType.DEPOSIT || isIncoming)
                        ? "+" : "-";
                table.addCell(sign + t.getAmount() + " " + account.getCurrency());

                // Affiche le bon solde selon si c'est account ou destinationAccount
                BigDecimal displayBalance = isIncoming ? t.getDestinationBalanceAfter() : t.getBalanceAfter();
                table.addCell(displayBalance + " " + account.getCurrency());
            }

            document.add(table);

            // Résumé
            document.add(new Paragraph("\nRésumé de la période").setBold().setFontSize(12).setMarginTop(20));
            document.add(new Paragraph("Nombre de transactions : " + transactions.size()));
            document.add(new Paragraph("Total des dépôts : +" + totalDeposits + " " + account.getCurrency()));
            document.add(new Paragraph("Total des virements reçus : +" + totalTransfersIn + " " + account.getCurrency()));
            document.add(new Paragraph("Total des retraits : -" + totalWithdrawals + " " + account.getCurrency()));
            document.add(new Paragraph("Total des virements envoyés : -" + totalTransfersOut + " " + account.getCurrency()));

            // Pied de page
            document.add(new Paragraph("\n\nGénéré le " + LocalDateTime.now().format(formatter))
                    .setFontSize(8)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(30));

            document.close();

            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF statement: " + e.getMessage(), e);
        }
    }
}