export type ClientHistoryItem = {
  id: string;
  clientId: string;
  date: string;
  title: string;
  type: "intervention" | "devis" | "facture";
  status: string;
};

export const clientHistory: ClientHistoryItem[] = [
  {
    id: "1",
    clientId: "1",
    date: "18/07/2026",
    title: "Réparation d’une fuite sous évier",
    type: "intervention",
    status: "Terminée",
  },
  {
    id: "2",
    clientId: "1",
    date: "03/06/2026",
    title: "Remplacement d’un robinet",
    type: "intervention",
    status: "Terminée",
  },
  {
    id: "3",
    clientId: "1",
    date: "15/05/2026",
    title: "Devis remplacement chauffe-eau",
    type: "devis",
    status: "Accepté",
  },
  {
    id: "4",
    clientId: "2",
    date: "10/07/2026",
    title: "Entretien annuel",
    type: "intervention",
    status: "Terminée",
  },
];