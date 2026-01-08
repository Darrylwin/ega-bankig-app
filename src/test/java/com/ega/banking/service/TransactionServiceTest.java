package com.ega.banking.service;

import com.ega.banking.entity.*;
import com.ega.banking.exception.AccountNotActiveException;
import com.ega.banking.exception.InsufficientBalanceException;
import com.ega.banking.exception.InvalidOperationException;
import com.ega.banking.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TransactionService
 */
@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountService accountService;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    private Account activeAccount;
    private Account blockedAccount;
    private Customer customer;

    @BeforeEach
    void setUp() {
        // Prépare un client
        customer = new Customer();
        customer.setId(1L);
        customer.setFirstName("John");
        customer.setLastName("Doe");
        customer.setEmail("john@test.com");
        customer.setPhoneNumber("+33612345678");
        customer.setDateOfBirth(LocalDate.of(1990, 1, 1));
        customer.setGender(Gender.MALE);
        customer.setAddress("123 Test St");
        customer.setNationality("French");

        // Prépare un compte actif avec 1000€
        activeAccount = new Account();
        activeAccount.setId(1L);
        activeAccount.setAccountNumber("FR7612345678901234567890123");
        activeAccount.setAccountType(AccountType.CURRENT);
        activeAccount.setBalance(new BigDecimal("1000.00"));
        activeAccount.setCurrency("EUR");
        activeAccount.setStatus(AccountStatus.ACTIVE);
        activeAccount.setCustomer(customer);

        // Prépare un compte bloqué
        blockedAccount = new Account();
        blockedAccount.setId(2L);
        blockedAccount.setAccountNumber("FR7698765432109876543210987");
        blockedAccount.setAccountType(AccountType.SAVINGS);
        blockedAccount.setBalance(new BigDecimal("500.00"));
        blockedAccount.setCurrency("EUR");
        blockedAccount.setStatus(AccountStatus.BLOCKED);
        blockedAccount.setCustomer(customer);
    }

    @Test
    @DisplayName("Should deposit money successfully")
    void testDeposit_Success() {
        // Given
        BigDecimal amount = new BigDecimal("500.00");
        when(accountService.getAccountById(1L)).thenReturn(activeAccount);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        Transaction transaction = transactionService.deposit(1L, amount, "Test deposit");

        // Then
        assertThat(transaction).isNotNull();
        assertThat(transaction.getTransactionType()).isEqualTo(TransactionType.DEPOSIT);
        assertThat(transaction.getAmount()).isEqualTo(amount);
        assertThat(transaction.getStatus()).isEqualTo(TransactionStatus.SUCCESS);
        assertThat(activeAccount.getBalance()).isEqualTo(new BigDecimal("1500.00"));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    @DisplayName("Should throw exception when depositing to blocked account")
    void testDeposit_BlockedAccount() {
        // Given
        BigDecimal amount = new BigDecimal("500.00");
        when(accountService.getAccountById(2L)).thenReturn(blockedAccount);

        // When & Then
        assertThatThrownBy(() -> transactionService.deposit(2L, amount, "Test deposit"))
                .isInstanceOf(AccountNotActiveException.class)
                .hasMessageContaining("not active");

        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when amount is zero or negative")
    void testDeposit_InvalidAmount() {
        // Given
        BigDecimal invalidAmount = BigDecimal.ZERO;

        // When & Then
        assertThatThrownBy(() -> transactionService.deposit(1L, invalidAmount, "Test"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("greater than 0");
    }

    @Test
    @DisplayName("Should withdraw money successfully")
    void testWithdraw_Success() {
        // Given
        BigDecimal amount = new BigDecimal("300.00");
        when(accountService.getAccountById(1L)).thenReturn(activeAccount);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        Transaction transaction = transactionService.withdraw(1L, amount, "Test withdrawal");

        // Then
        assertThat(transaction).isNotNull();
        assertThat(transaction.getTransactionType()).isEqualTo(TransactionType.WITHDRAWAL);
        assertThat(transaction.getAmount()).isEqualTo(amount);
        assertThat(activeAccount.getBalance()).isEqualTo(new BigDecimal("700.00"));
    }

    @Test
    @DisplayName("Should throw exception when insufficient balance")
    void testWithdraw_InsufficientBalance() {
        // Given
        BigDecimal amount = new BigDecimal("1500.00"); // Plus que le solde
        when(accountService.getAccountById(1L)).thenReturn(activeAccount);

        // When & Then
        assertThatThrownBy(() -> transactionService.withdraw(1L, amount, "Test"))
                .isInstanceOf(InsufficientBalanceException.class)
                .hasMessageContaining("Insufficient balance");

        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should transfer money successfully")
    void testTransfer_Success() {
        // Given
        Account destinationAccount = new Account();
        destinationAccount.setId(3L);
        destinationAccount.setAccountNumber("FR7611111111111111111111111");
        destinationAccount.setBalance(new BigDecimal("200.00"));
        destinationAccount.setStatus(AccountStatus.ACTIVE);
        destinationAccount.setCustomer(customer);

        BigDecimal amount = new BigDecimal("400.00");
        when(accountService.getAccountById(1L)).thenReturn(activeAccount);
        when(accountService.getAccountById(3L)).thenReturn(destinationAccount);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(i -> i.getArguments()[0]);

        // When
        Transaction transaction = transactionService.transfer(1L, 3L, amount, "Test transfer");

        // Then
        assertThat(transaction).isNotNull();
        assertThat(transaction.getTransactionType()).isEqualTo(TransactionType.TRANSFER);
        assertThat(activeAccount.getBalance()).isEqualTo(new BigDecimal("600.00"));
        assertThat(destinationAccount.getBalance()).isEqualTo(new BigDecimal("600.00"));
    }

    @Test
    @DisplayName("Should throw exception when transferring to same account")
    void testTransfer_SameAccount() {
        // Given
        BigDecimal amount = new BigDecimal("100.00");

        // When & Then
        assertThatThrownBy(() -> transactionService.transfer(1L, 1L, amount, "Test"))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("must be different");
    }

    @Test
    @DisplayName("Should get transactions by account ID")
    void testGetTransactionsByAccountId() {
        // Given
        Transaction t1 = new Transaction();
        t1.setId(1L);
        t1.setAmount(new BigDecimal("100.00"));

        Transaction t2 = new Transaction();
        t2.setId(2L);
        t2.setAmount(new BigDecimal("200.00"));

        when(accountService.getAccountById(1L)).thenReturn(activeAccount);
        when(transactionRepository.findByAccountIdOrderByTransactionDateDesc(1L))
                .thenReturn(Arrays.asList(t1, t2));

        // When
        List<Transaction> transactions = transactionService.getTransactionsByAccountId(1L);

        // Then
        assertThat(transactions).hasSize(2);
        assertThat(transactions).extracting(Transaction::getId).contains(1L, 2L);
    }

    @Test
    @DisplayName("Should get transactions by period")
    void testGetTransactionsByPeriod() {
        // Given
        LocalDateTime start = LocalDateTime.now().minusDays(7);
        LocalDateTime end = LocalDateTime.now();

        Transaction t1 = new Transaction();
        t1.setId(1L);

        when(accountService.getAccountById(1L)).thenReturn(activeAccount);
        when(transactionRepository.findByAccountAndDateBetween(1L, start, end))
                .thenReturn(Arrays.asList(t1));

        // When
        List<Transaction> transactions = transactionService.getTransactionsByAccountIdAndPeriod(1L, start, end);

        // Then
        assertThat(transactions).hasSize(1);
    }

    @Test
    @DisplayName("Should throw exception when start date is after end date")
    void testGetTransactionsByPeriod_InvalidDates() {
        // Given
        LocalDateTime start = LocalDateTime.now();
        LocalDateTime end = LocalDateTime.now().minusDays(7);
        when(accountService.getAccountById(1L)).thenReturn(activeAccount);

        // When & Then
        assertThatThrownBy(() -> transactionService.getTransactionsByAccountIdAndPeriod(1L, start, end))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("Start date must be before end date");
    }
}