import { Client } from "@/src/types/client";

export const clients: Client[] = [
  {
    id: "1",
    type: "particulier",

    firstName: "Jean",
    lastName: "Martin",

    phone: "06 12 34 56 78",
    email: "jean.martin@email.fr",

    address: {
      street: "12 Rue Victor Hugo",
      postalCode: "75015",
      city: "Paris",
      country: "France",
    },

    notes: "Client fidèle depuis 2022.",

    isActive: true,

    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: "2",
    type: "professionnel",

    companyName: "Garage Dupont",

    phone: "01 45 67 89 10",
    email: "contact@garage-dupont.fr",

    address: {
      street: "8 Avenue de la République",
      postalCode: "69003",
      city: "Lyon",
      country: "France",
    },

    notes: "Contrat d'entretien annuel.",

    isActive: true,

    createdAt: new Date(),
    updatedAt: new Date(),
  },
];