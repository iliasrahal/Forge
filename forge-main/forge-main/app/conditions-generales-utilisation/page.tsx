import type { Metadata } from "next";

import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Conditions Générales d’Utilisation | Forge",
  description: "Conditions d’utilisation de la plateforme Forge.",
};

const sections = [
  {
    title: "Objet et acceptation",
    paragraphs: [
      "Les présentes Conditions Générales d’Utilisation encadrent l’accès et l’utilisation de Forge, une solution numérique destinée à simplifier l’organisation administrative des artisans.",
      "La création d’un compte et l’utilisation du service impliquent l’acceptation de ces conditions. Si vous n’acceptez pas ces règles, vous ne devez pas utiliser Forge.",
    ],
  },
  {
    title: "Accès au service",
    paragraphs: [
      "L’utilisateur doit fournir des informations exactes lors de son inscription et maintenir ses coordonnées à jour. Il est responsable de la confidentialité de ses identifiants et des actions réalisées depuis son compte.",
    ],
    items: [
      "Utiliser une adresse email et un numéro de téléphone valides.",
      "Choisir un mot de passe suffisamment sécurisé.",
      "Informer Forge rapidement en cas d’accès non autorisé au compte.",
    ],
  },
  {
    title: "Fonctionnalités de Forge",
    paragraphs: [
      "Forge permet notamment de gérer des clients, des interventions, des comptes rendus, des devis et des factures, ainsi que de préparer certaines actions grâce à une assistance intelligente.",
      "Les suggestions produites par Forge doivent être relues et validées par l’artisan avant leur utilisation ou leur transmission à un client. L’utilisateur reste responsable des informations professionnelles, contractuelles, fiscales et tarifaires qu’il enregistre ou envoie.",
    ],
  },
  {
    title: "Utilisation autorisée",
    items: [
      "Utiliser Forge dans le cadre d’une activité licite.",
      "Respecter les droits des clients et des tiers, notamment la confidentialité de leurs données.",
      "Ne pas tenter de contourner la sécurité, perturber le service ou accéder au compte d’un tiers.",
      "Ne pas transmettre de contenu illicite, trompeur ou portant atteinte aux droits d’autrui.",
    ],
  },
  {
    title: "Disponibilité et évolution",
    paragraphs: [
      "Forge met en œuvre des moyens raisonnables pour assurer la disponibilité et la sécurité du service. Des interruptions peuvent néanmoins intervenir pour maintenance, mise à jour, incident technique ou événement indépendant de notre volonté.",
      "Les fonctionnalités peuvent évoluer afin d’améliorer le produit, sa sécurité ou sa conformité, sans altérer abusivement les droits des utilisateurs.",
    ],
  },
  {
    title: "Données et contenus professionnels",
    paragraphs: [
      "L’utilisateur conserve la responsabilité des contenus qu’il ajoute dans Forge. Il doit disposer des droits et autorisations nécessaires pour enregistrer les informations de ses clients, documents et photographies.",
      "Le traitement de ces informations est détaillé dans la Politique de confidentialité de Forge.",
    ],
  },
  {
    title: "Suspension et fermeture du compte",
    paragraphs: [
      "L’utilisateur peut demander la suppression de son compte depuis les paramètres prévus à cet effet. Forge peut suspendre un accès en cas de risque de sécurité, d’usage frauduleux ou de violation grave des présentes conditions.",
      "Certaines informations peuvent être conservées après la fermeture lorsqu’une obligation légale, comptable ou de sécurité l’exige.",
    ],
  },
  {
    title: "Responsabilité",
    paragraphs: [
      "Forge est un outil d’assistance et d’organisation. Il ne remplace pas le jugement professionnel de l’artisan, ni les vérifications juridiques, fiscales, techniques ou de sécurité nécessaires à son activité.",
      "L’utilisateur demeure responsable des décisions prises, des prestations réalisées et des documents transmis à ses clients.",
    ],
  },
  {
    title: "Nous contacter",
    paragraphs: [
      "Toute question concernant ces conditions peut être transmise depuis les moyens de contact ou d’assistance mis à disposition dans Forge. Les informations d’identification de l’éditeur applicables au service sont communiquées dans les supports officiels de Forge.",
    ],
  },
];

type TermsPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function TermsPage({ searchParams }: TermsPageProps) {
  const { returnTo } = await searchParams;

  return (
    <LegalPageShell
      eyebrow="Cadre d’utilisation"
      title="Conditions Générales d’Utilisation"
      introduction="Les règles essentielles pour utiliser Forge de manière claire, responsable et sécurisée."
      updatedAt="27 août 2026"
      sections={sections}
      returnHref={returnTo === "/onboarding" ? "/onboarding" : "/"}
    />
  );
}
