package com.ega.banking.dto;

import com.ega.banking.entity.Customer;
import org.springframework.stereotype.Component;

/**
 * Mapper pour convertir entre Customer et CustomerDTO
 */
@Component
public class CustomerMapper {

    /**
     * Convertit une entité Customer en DTO
     */
    public CustomerDTO toDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setLastName(customer.getLastName());
        dto.setFirstName(customer.getFirstName());
        dto.setDateOfBirth(customer.getDateOfBirth());
        dto.setGender(customer.getGender());
        dto.setAddress(customer.getAddress());
        dto.setPhoneNumber(customer.getPhoneNumber());
        dto.setEmail(customer.getEmail());
        dto.setNationality(customer.getNationality());
        dto.setCreatedAt(customer.getCreatedAt());
        dto.setAge(customer.getAge());
        return dto;
    }

    /**
     * Convertit un CustomerRequestDTO en entité Customer
     */
    public Customer toEntity(CustomerRequestDTO dto) {
        Customer customer = new Customer();
        customer.setLastName(dto.getLastName());
        customer.setFirstName(dto.getFirstName());
        customer.setDateOfBirth(dto.getDateOfBirth());
        customer.setGender(dto.getGender());
        customer.setAddress(dto.getAddress());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setEmail(dto.getEmail());
        customer.setNationality(dto.getNationality());
        return customer;
    }
}