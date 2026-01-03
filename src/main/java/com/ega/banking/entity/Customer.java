package com.ega.banking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entité représentant un client de la banque
 * Sera transformée en table "customers"
 */
@Entity
@Table(name = "customers")
@Data  // Génère automatiquement getters, setters, toString, equals, hashCode
@NoArgsConstructor  // Constructeur sans arguments
@AllArgsConstructor  // Constructeur avec tous les arguments
public class Customer {

    @Id  // Clé primaire
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-incrémentation
    private Long id;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 50, message = "Last name must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String lastName;

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50, message = "First name must be between 2 and 50 characters")
    @Column(nullable = false, length = 50)
    private String firstName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    @Column(nullable = false)
    private LocalDate dateOfBirth;

    @NotNull(message = "Gender is required")
    @Enumerated(EnumType.STRING)  // Stocke l'enum comme texte en base
    @Column(nullable = false)
    private Gender gender;

    @NotBlank(message = "Address is required")
    @Column(nullable = false, length = 200)
    private String address;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$",
            message = "Invalid phone format (e.g., +33612345678)")
    @Column(nullable = false, unique = true, length = 20)
    private String phoneNumber;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "Nationality is required")
    @Column(nullable = false, length = 50)
    private String nationality;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Relation One-to-Many : Un client peut avoir plusieurs comptes
     * mappedBy = "customer" : Le lien est défini dans Account.customer
     * cascade = CascadeType.ALL : Si on supprime un client, ses comptes sont supprimés
     * fetch = FetchType.LAZY : Les comptes ne sont chargés que si nécessaire (optimisation)
     */
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Account> accounts = new ArrayList<>();

    /**
     * Méthode appelée automatiquement AVANT l'insertion en base de données
     * Initialise la date de création
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    /**
     * Calcule l'âge du client à partir de sa date de naissance
     * @return L'âge en années
     */
    public int getAge() {
        if (dateOfBirth == null) {
            return 0;
        }
        return LocalDate.now().getYear() - dateOfBirth.getYear();
    }
}