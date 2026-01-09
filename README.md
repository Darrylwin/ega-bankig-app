# EGA Banking - Frontend Angular

Application web de gestion bancaire développée avec Angular et Nebular UI.

## Table des matières

- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement de l'application](#lancement-de-lapplication)
- [Structure du projet](#structure-du-projet)
- [Fonctionnalités](#fonctionnalités)
- [API Backend](#api-backend)
- [Authentification](#authentification)
- [Crédits](#crédits)

## Technologies utilisées

- **Angular** - Framework JavaScript
- **Nebular UI** - Framework UI basé sur Angular
- **TypeScript** - Langage de programmation
- **RxJS** - Programmation réactive
- **Angular Router** - Navigation
- **HttpClient** - Communication avec l'API

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (version 16 ou supérieure)
- **npm** (version 8 ou supérieure)
- **Angular CLI** : `npm install -g @angular/cli`

## Installation

1. **Cloner le dépôt**
```bash
git clone --branch frontend https://github.com/Darrylwin/ega-banking-app
cd ega-banking-app
```

2. **Installer les dépendances**
```bash
npm install --legacy-peer-deps
```

## Configuration

1. **Configurer l'URL de l'API**

Éditez le fichier `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'  // URL de votre backend
};
```

2. **Configuration pour la production**

Éditez `src/environments/environment.prod.ts` pour l'environnement de production.

## Lancement de l'application

### Mode développement

```bash
npm start
# ou
ng serve
```

L'application sera accessible sur `http://localhost:4200`

### Build de production

```bash
npm run build
# ou
ng build --configuration production
```

Les fichiers seront générés dans le dossier `dist/`

## Structure du projet

```
src/
├── app/
│   ├── @core/                    # Services et modules partagés
│   │   ├── components/           # Composants réutilisables
│   │   ├── data/
│   │   │   ├── api/              # Services API
│   │   │   ├── interceptors/     # Intercepteurs HTTP
│   │   │   └── models/           # Modèles TypeScript
│   │   ├── guards/               # Guards de navigation
│   │   └── services/             # Services globaux
│   │
│   ├── @theme/                   # Thème et layouts
│   │   ├── components/           # Composants du thème
│   │   └── layouts/              # Layouts (header, sidebar)
│   │
│   └── pages/                    # Pages de l'application
│       ├── auth/                 # Authentification
│       ├── dashboard/            # Tableau de bord
│       ├── customers/            # Gestion clients
│       ├── accounts/             # Gestion comptes
│       └── transactions/         # Opérations bancaires
│
└── environments/                 # Configuration des environnements
```

## Fonctionnalités

### Authentification
- Connexion avec email et mot de passe
- Gestion des sessions avec JWT
- Protection des routes avec AuthGuard

### Gestion des Clients
- Liste paginée des clients
- Création de nouveaux clients
- Modification des informations
- Suppression de clients

### Gestion des Comptes
- Création de comptes (Épargne / Courant)
- Consultation des comptes par client
- Génération de relevés bancaires (PDF)
- Consultation du solde

### Opérations Bancaires
- **Dépôt** : Créditer un compte
- **Retrait** : Débiter un compte (avec vérification du solde)
- **Virement** : Transférer des fonds entre comptes

### Tableau de bord
- Statistiques en temps réel
- Nombre de clients, comptes, transactions
- Montants des opérations (jour, semaine, mois)

### Historique des transactions
- Liste complète des transactions
- Filtrage par période
- Recherche par compte
- Export des relevés

## API Backend

L'application communique avec une API REST Java EE (Spring Boot).

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Authentification |
| `/api/customers` | GET, POST | Gestion clients |
| `/api/accounts` | GET, POST | Gestion comptes |
| `/api/transactions/deposit` | POST | Dépôt |
| `/api/transactions/withdraw` | POST | Retrait |
| `/api/transactions/transfer` | POST | Virement |
| `/api/dashboard/stats` | GET | Statistiques |

## Authentification

### Flow d'authentification

1. L'utilisateur saisit email + mot de passe
2. Le backend valide et retourne un **token JWT**
3. Le token est sauvegardé dans le `localStorage`
4. Le **JwtInterceptor** ajoute automatiquement le token à chaque requête
5. L'**ErrorInterceptor** gère les erreurs (401 → redirection vers login)

### Rôles disponibles

- **ROLE_ADMIN** : Accès complet à toutes les fonctionnalités
- **ROLE_USER** : Accès limité (consultation uniquement)

### Protection des routes

```typescript
// Dans app-routing.module.ts
{
  path: 'pages',
  canActivate: [AuthGuard],  // Nécessite une authentification
  loadChildren: () => import('./pages/pages.module')
}
```


## Personnalisation du thème

Le thème Nebular peut être personnalisé dans `src/@theme/styles/themes.scss`

## Crédits

**Projet académique - TP Java EE**

- **Établissement** : IAI-Togo
- **Année scolaire** : 2025-2026
- **Framework Frontend** : Angular + Nebular UI
- **Framework Backend** : Spring Boot

---

**Note** : Ce README fait partie du projet de Travaux Pratiques en Programmation Java EE.