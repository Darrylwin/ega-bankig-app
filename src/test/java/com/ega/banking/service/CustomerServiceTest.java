package com.ega.banking.service;

import com.ega.banking.entity.Customer;
import com.ega.banking.entity.Gender;
import com.ega.banking.exception.DuplicateResourceException;
import com.ega.banking.exception.InvalidOperationException;
import com.ega.banking.exception.ResourceNotFoundException;
import com.ega.banking.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour CustomerService
 * Utilise Mockito pour mocker les dépendances
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private Customer validCustomer;

    @BeforeEach
    void setUp() {
        // Prépare un client valide pour les tests
        validCustomer = new Customer();
        validCustomer.setId(1L);
        validCustomer.setFirstName("John");
        validCustomer.setLastName("Doe");
        validCustomer.setEmail("john.doe@test.com");
        validCustomer.setPhoneNumber("+33612345678");
        validCustomer.setDateOfBirth(LocalDate.of(1990, 1, 1));
        validCustomer.setGender(Gender.MALE);
        validCustomer.setAddress("123 Test Street");
        validCustomer.setNationality("French");
    }

    @Test
    @DisplayName("Should create customer successfully")
    void testCreateCustomer_Success() {
        // Given
        when(customerRepository.existsByEmail(validCustomer.getEmail())).thenReturn(false);
        when(customerRepository.existsByPhoneNumber(validCustomer.getPhoneNumber())).thenReturn(false);
        when(customerRepository.save(any(Customer.class))).thenReturn(validCustomer);

        // When
        Customer createdCustomer = customerService.createCustomer(validCustomer);

        // Then
        assertThat(createdCustomer).isNotNull();
        assertThat(createdCustomer.getEmail()).isEqualTo("john.doe@test.com");
        verify(customerRepository, times(1)).save(validCustomer);
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void testCreateCustomer_DuplicateEmail() {
        // Given
        when(customerRepository.existsByEmail(validCustomer.getEmail())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> customerService.createCustomer(validCustomer))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email");

        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when phone number already exists")
    void testCreateCustomer_DuplicatePhoneNumber() {
        // Given
        when(customerRepository.existsByEmail(validCustomer.getEmail())).thenReturn(false);
        when(customerRepository.existsByPhoneNumber(validCustomer.getPhoneNumber())).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> customerService.createCustomer(validCustomer))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Phone number");

        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when customer is under 18")
    void testCreateCustomer_UnderAge() {
        // Given
        validCustomer.setDateOfBirth(LocalDate.now().minusYears(15));
        when(customerRepository.existsByEmail(validCustomer.getEmail())).thenReturn(false);
        when(customerRepository.existsByPhoneNumber(validCustomer.getPhoneNumber())).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> customerService.createCustomer(validCustomer))
                .isInstanceOf(InvalidOperationException.class)
                .hasMessageContaining("18 years old");

        verify(customerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should get all customers")
    void testGetAllCustomers() {
        // Given
        Customer customer2 = new Customer();
        customer2.setId(2L);
        customer2.setFirstName("Jane");
        customer2.setLastName("Smith");
        customer2.setEmail("jane.smith@test.com");

        when(customerRepository.findAll()).thenReturn(Arrays.asList(validCustomer, customer2));

        // When
        List<Customer> customers = customerService.getAllCustomers();

        // Then
        assertThat(customers).hasSize(2);
        assertThat(customers).extracting(Customer::getEmail)
                .contains("john.doe@test.com", "jane.smith@test.com");
    }

    @Test
    @DisplayName("Should get customer by ID")
    void testGetCustomerById_Success() {
        // Given
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));

        // When
        Customer foundCustomer = customerService.getCustomerById(1L);

        // Then
        assertThat(foundCustomer).isNotNull();
        assertThat(foundCustomer.getId()).isEqualTo(1L);
        assertThat(foundCustomer.getEmail()).isEqualTo("john.doe@test.com");
    }

    @Test
    @DisplayName("Should throw exception when customer not found")
    void testGetCustomerById_NotFound() {
        // Given
        when(customerRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> customerService.getCustomerById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Customer")
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("Should update customer successfully")
    void testUpdateCustomer_Success() {
        // Given
        Customer updatedData = new Customer();
        updatedData.setFirstName("John Updated");
        updatedData.setLastName("Doe Updated");
        updatedData.setEmail("john.doe@test.com");
        updatedData.setPhoneNumber("+33612345678");
        updatedData.setDateOfBirth(LocalDate.of(1990, 1, 1));
        updatedData.setGender(Gender.MALE);
        updatedData.setAddress("456 New Street");
        updatedData.setNationality("French");

        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));
        when(customerRepository.save(any(Customer.class))).thenReturn(validCustomer);

        // When
        Customer result = customerService.updateCustomer(1L, updatedData);

        // Then
        assertThat(result).isNotNull();
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Should delete customer successfully")
    void testDeleteCustomer_Success() {
        // Given
        when(customerRepository.findById(1L)).thenReturn(Optional.of(validCustomer));
        doNothing().when(customerRepository).delete(validCustomer);

        // When
        customerService.deleteCustomer(1L);

        // Then
        verify(customerRepository, times(1)).delete(validCustomer);
    }

    @Test
    @DisplayName("Should get customer by email")
    void testGetCustomerByEmail_Success() {
        // Given
        when(customerRepository.findByEmail("john.doe@test.com"))
                .thenReturn(Optional.of(validCustomer));

        // When
        Customer foundCustomer = customerService.getCustomerByEmail("john.doe@test.com");

        // Then
        assertThat(foundCustomer).isNotNull();
        assertThat(foundCustomer.getEmail()).isEqualTo("john.doe@test.com");
    }
}