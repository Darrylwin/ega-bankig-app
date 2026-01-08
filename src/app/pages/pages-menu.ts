import { NbMenuItem } from "@nebular/theme";

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: "Tableau de bord",
    icon: "home-outline",
    link: "/pages/dashboard",
    home: true,
  },
  {
    title: "Gestion des Clients",
    icon: "people-outline",
    link: "/pages/customers",
  },
  {
    title: "Gestion des Comptes",
    icon: "credit-card-outline",
    link: "/pages/accounts",
  },
  {
    title: "Opérations Bancaires",
    icon: "sync-outline",
    expanded: false,
    children: [
      {
        title: "Toutes les opérations",
        link: "/pages/transactions",
        icon: "list-outline",
      },
      {
        title: "Dépôt",
        link: "/pages/transactions/deposit",
        icon: "trending-up-outline",
      },
      {
        title: "Retrait",
        link: "/pages/transactions/withdraw",
        icon: "trending-down-outline",
      },
      {
        title: "Virement",
        link: "/pages/transactions/transfer",
        icon: "swap-outline",
      },
    ],
  },
  {
    title: "Historique",
    icon: "archive-outline",
    link: "/pages/transactions/history",
  },
  {
    title: "Administration",
    icon: "settings-2-outline",
    link: "/pages/admin",
    hidden: true,
  },
];