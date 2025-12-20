# 🏦 EGA Banking System - Backend API

Système de gestion bancaire développé avec **Spring Boot** et **MySQL**.  
Projet académique pour le cours de Programmation Java EE - GLSI 2025-2026.

---

## 📋 Table des matières

- [Description](#-description)
- [Technologies utilisées](#-technologies-utilisées)
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement de l'application](#-lancement-de-lapplication)
- [Endpoints API](#-endpoints-api)
- [Tests avec Postman](#-tests-avec-postman)
- [Structure du projet](#-structure-du-projet)
- [Sécurité](#-sécurité)
- [Contributeurs](#-contributeurs)

---

## 📖 Description

EGA Banking System est une API REST complète permettant de gérer :
- Les clients de la banque
- Les comptes bancaires (épargne et courant)
- Les transactions bancaires (dépôts, retraits, virements)
- L'authentification et l'autorisation des utilisateurs

Le système génère automatiquement des numéros IBAN valides et garantit la sécurité des transactions grâce à Spring Security et JWT.

---

## 🛠 Technologies utilisées

### Backend
- **Java 17**
- **Spring Boot 3.2.x**
    - Spring Web (API REST)
    - Spring Data JPA (Persistance)
    - Spring Security (Authentification/Autorisation)
    - Spring Validation
- **MySQL 8.0** (Base de données)
- **JWT (JSON Web Tokens)** pour l'authentification
- **IBAN4J** pour la génération de numéros IBAN
- **Lombok** pour réduire le code boilerplate
- **Maven** pour la gestion des dépendances

### Outils
- **Postman** pour les tests API
- **Swagger/OpenAPI** pour la documentation

---

## ✨ Fonctionnalités

### 🔐 Authentification
- ✅ Inscription d'utilisateurs
- ✅ Connexion avec JWT
- ✅ Gestion des rôles (ADMIN, USER)
- ✅ Hachage sécurisé des mots de passe (BCrypt)

### 👥 Gestion des clients
- ✅ CRUD complet (Create, Read, Update, Delete)
- ✅ Validation des données (email unique, téléphone unique, âge ≥ 18 ans)
- ✅ Recherche par email

### 💳 Gestion des comptes
- ✅ Création de comptes (épargne/courant)
- ✅ Génération automatique d'IBAN unique
- ✅ Association client-compte
- ✅ Consultation du solde

### 💰 Gestion des transactions
- ✅ Dépôt d'argent
- ✅ Retrait d'argent (avec vérification du solde)
- ✅ Virement entre comptes
- ✅ Historique des transactions
- ✅ Filtrage par période
- ✅ Transactions atomiques (rollback automatique en cas d'erreur)

### 🛡️ Sécurité
- ✅ Authentification JWT
- ✅ Autorisation par rôles (@PreAuthorize)
- ✅ Gestion globale des exceptions
- ✅ Validation des entrées
- ✅ Protection CORS

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Java JDK 17** ou supérieur
- **MySQL 8.0** ou supérieur
- **Maven 3.6+** (ou utilisez le wrapper Maven inclus `./mvnw`)
- **Git** (pour cloner le projet)
- **Postman** (pour tester l'API)

---

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Darrylwin/ega-banking-app
cd ega-banking-app
```

### 2. Créer la base de données MySQL

Connectez-vous à MySQL et exécutez :

```sql
-- Créez la base de données
CREATE DATABASE ega_bank;

-- Créez l'utilisateur
CREATE USER 'ega_user'@'localhost' IDENTIFIED BY 'ega_password';

-- Donnez tous les droits sur la base de données
GRANT ALL PRIVILEGES ON ega_bank.* TO 'ega_user'@'localhost';

-- Appliquez les changements
FLUSH PRIVILEGES;

-- Vérifiez
SHOW GRANTS FOR 'ega_user'@'localhost';
```

### 3. Installer les dépendances

```bash
./mvnw clean install
```

---

## ⚙️ Configuration

Le fichier de configuration se trouve dans `src/main/resources/application.properties`.

### Configuration de base

```properties
# Port du serveur
server.port=8080

# Base de données MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/ega_bank?useSSL=false&serverTimezone=UTC
spring.datasource.username=ega_user
spring.datasource.password=ega_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# JWT
jwt.secret=uneCleSecreteTresLongueEtSecuriseePourLaSignatureDesTokensJWT123456789
jwt.expiration=86400000

# CORS (pour le frontend)
cors.allowed-origins=http://localhost:4200

# Logs
logging.level.com.ega.banking=DEBUG
```

### 🔑 Important : Changez le `jwt.secret` en production !

Générez une clé secrète sécurisée pour la production :
```bash
openssl rand -base64 64
```

---

## 🎯 Lancement de l'application

### Méthode 1 : Avec Maven Wrapper

```bash
./mvnw spring-boot:run
```

### Méthode 2 : Avec Maven installé

```bash
mvn spring-boot:run
```

### Méthode 3 : Depuis votre IDE

Exécutez la classe `EgaApplication.java`

### Vérification

L'application démarre sur **http://localhost:8080**

Vous devriez voir dans la console :
```
========================================
🚀 EGA Banking Application Started!
📍 API: http://localhost:8080/api
📚 Swagger: http://localhost:8080/swagger-ui.html
========================================
```

---

## 🔌 Endpoints API

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/api/auth/register` | Inscription | Non |
| POST | `/api/auth/login` | Connexion | Non |

### 👥 Clients (`/api/customers`)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/api/customers` | Créer un client | ADMIN |
| GET | `/api/customers` | Liste tous les clients | ADMIN |
| GET | `/api/customers/{id}` | Détails d'un client | ADMIN, USER |
| PUT | `/api/customers/{id}` | Modifier un client | ADMIN |
| DELETE | `/api/customers/{id}` | Supprimer un client | ADMIN |
| GET | `/api/customers/email/{email}` | Rechercher par email | ADMIN |

### 💳 Comptes (`/api/accounts`)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/api/accounts` | Créer un compte | ADMIN |
| GET | `/api/accounts` | Liste tous les comptes | ADMIN |
| GET | `/api/accounts/{id}` | Détails d'un compte | ADMIN, USER |
| GET | `/api/accounts/number/{accountNumber}` | Rechercher par IBAN | ADMIN, USER |
| GET | `/api/accounts/customer/{customerId}` | Comptes d'un client | ADMIN, USER |
| DELETE | `/api/accounts/{id}` | Supprimer un compte | ADMIN |

### 💰 Transactions (`/api/transactions`)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/api/transactions/deposit` | Faire un dépôt | ADMIN, USER |
| POST | `/api/transactions/withdraw` | Faire un retrait | ADMIN, USER |
| POST | `/api/transactions/transfer` | Faire un virement | ADMIN, USER |
| GET | `/api/transactions/account/{accountId}` | Historique d'un compte | ADMIN, USER |
| GET | `/api/transactions/account/{accountId}/period` | Transactions par période | ADMIN, USER |
| GET | `/api/transactions/{id}` | Détails d'une transaction | ADMIN, USER |

---

## 📮 Tests avec Postman

### 1. Inscription d'un utilisateur

**POST** `http://localhost:8080/api/auth/register`

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse** :
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "roles": ["ROLE_USER"]
}
```

### 2. Connexion

**POST** `http://localhost:8080/api/auth/login`

```json
{
  "username": "john_doe",
  "password": "password123"
}
```

### 3. Utiliser le token

Pour toutes les requêtes protégées, ajoutez le header :

```
Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
```

### 4. Créer un client (ADMIN uniquement)

**POST** `http://localhost:8080/api/customers`

**Headers** : `Authorization: Bearer <token>`

```json
{
  "lastName": "Doe",
  "firstName": "John",
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "address": "123 Main Street, Paris",
  "phoneNumber": "+33612345678",
  "email": "john.customer@example.com",
  "nationality": "French"
}
```

### 5. Créer un compte

**POST** `http://localhost:8080/api/accounts`

```json
{
  "customerId": 1,
  "accountType": "SAVINGS",
  "currency": "EUR"
}
```

### 6. Faire un dépôt

**POST** `http://localhost:8080/api/transactions/deposit`

```json
{
  "accountId": 1,
  "amount": 1000.00,
  "description": "Initial deposit"
}
```

### 7. Faire un retrait

**POST** `http://localhost:8080/api/transactions/withdraw`

```json
{
  "accountId": 1,
  "amount": 200.00,
  "description": "ATM withdrawal"
}
```

### 8. Faire un virement

**POST** `http://localhost:8080/api/transactions/transfer`

```json
{
  "sourceAccountId": 1,
  "destinationAccountId": 2,
  "amount": 500.00,
  "description": "Transfer to friend"
}
```

---

## 📁 Structure du projet

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/ega/banking/
│   │   │   ├── config/           # Configurations (Security, CORS)
│   │   │   ├── controller/       # Contrôleurs REST
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── entity/           # Entités JPA
│   │   │   ├── exception/        # Exceptions personnalisées
│   │   │   ├── repository/       # Repositories JPA
│   │   │   ├── security/         # Configuration JWT
│   │   │   ├── service/          # Services (logique métier)
│   │   │   └── EgaApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
├── pom.xml
└── README.md
```

---

## 🔒 Sécurité

### Authentification JWT

1. L'utilisateur s'inscrit ou se connecte
2. Le serveur retourne un token JWT valide 24h
3. Le client stocke le token (localStorage/sessionStorage)
4. Pour chaque requête protégée, le client envoie :
   ```
   Authorization: Bearer <token>
   ```
5. Le serveur valide le token et autorise l'accès

### Rôles et permissions

- **ROLE_USER** : Peut effectuer des opérations sur ses propres comptes
- **ROLE_ADMIN** : Accès complet à toutes les ressources

### Validation des données

- Validation côté serveur avec `@Valid`
- Contraintes sur les entités (@NotBlank, @Email, @Past, etc.)
- Gestion globale des exceptions

---

## 🧪 Tests

### Lancer les tests unitaires

```bash
./mvnw test
```

### Collection Postman

Une collection Postman complète est disponible dans `/postman/EGA_Banking.postman_collection.json`

---

## 🐛 Résolution des problèmes

### Erreur de connexion MySQL

```
Access denied for user 'ega_user'@'localhost'
```

**Solution** : Vérifiez que l'utilisateur MySQL existe et a les bonnes permissions.

### Port 8080 déjà utilisé

**Solution** : Changez le port dans `application.properties` :
```properties
server.port=8081
```

### Token JWT invalide

**Solution** : Vérifiez que :
- Le token n'a pas expiré (24h)
- Le header est bien `Authorization: Bearer <token>`
- Le secret JWT est le même que lors de la génération

---

## 📝 TODO / Améliorations futures

- [ ] Génération de relevés bancaires PDF
- [ ] Notifications par email
- [ ] Limitation du taux de requêtes (rate limiting)
- [ ] Logs d'audit
- [ ] Gestion des découverts autorisés
- [ ] Frais bancaires automatiques
- [ ] API de statistiques

---

## 👥 Contributeurs

- **[LOGOSSOU Ekoué Darryl-win](https://github.com/Darrylwin)**

---

## 📄 Licence

Ce projet est un travail académique réalisé dans le cadre du cours de Java EE.

---

## 📞 Contact

Pour toute question concernant ce projet, contactez LOGOSSOU Darryl

---

**🎓 Projet réalisé dans le cadre du TP Java EE - GLSI 2025-2026**