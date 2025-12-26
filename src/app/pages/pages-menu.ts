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
    icon: "swap-horizontal-outline",
    children: [
      {
        title: "Dépôt",
        link: "/pages/transactions/deposit",
      },
      {
        title: "Retrait",
        link: "/pages/transactions/withdraw",
      },
      {
        title: "Virement",
        link: "/pages/transactions/transfer",
      },
    ],
  },
  {
    title: "Historique",
    icon: "archive-outline",
    link: "/pages/transactions/history",
  },
  {
    title: "Relevés",
    icon: "file-text-outline",
    link: "/pages/statements",
  },
  {
    title: "Administration",
    icon: "settings-2-outline",
    children: [
      {
        title: "Utilisateurs",
        link: "/pages/admin/users",
      },
      {
        title: "Audit",
        link: "/pages/admin/audit",
      },
    ],
  },
  {
    title: "Documentation",
    icon: "book-open-outline",
    link: "/pages/miscellaneous/help",
  },
];
