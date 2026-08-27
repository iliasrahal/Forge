import type { Metadata } from "next";

import LegalPageShell from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Forge",
  description: "Informations sur la protection des données dans Forge.",
};

const sections = [
  {
    title: "Notre engagement",
    paragraphs: [
      "Forge accorde une attention particulière à la confidentialité des artisans et de leurs clients. Cette politique explique quelles données sont utilisées, pourquoi elles le sont et quels choix sont disponibles.",
    ],
  },
  {
    title: "Données traitées",
    items: [
      "Informations de compte : prénom, email, téléphone, préférences et informations professionnelles.",
      "Données clients enregistrées par l’artisan : identité, coordonnées, adresses et notes utiles.",
      "Données d’activité : interventions, comptes rendus, devis, factures et statuts associés.",
      "Contenus transmis à l’assistant Forge : textes, transcriptions vocales et photographies choisies par l’utilisateur.",
      "Données techniques nécessaires à la connexion, à la sécurité et au bon fonctionnement du service.",
    ],
  },
  {
    title: "Finalités du traitement",
    items: [
      "Créer, sécuriser et administrer le compte Forge.",
      "Fournir les fonctionnalités demandées par l’utilisateur.",
      "Générer, enregistrer et transmettre les documents professionnels demandés.",
      "Comprendre les instructions adressées à l’assistant et proposer des actions adaptées.",
      "Prévenir les abus, résoudre les incidents et améliorer la fiabilité du service.",
      "Respecter les obligations légales applicables.",
    ],
  },
  {
    title: "Bases du traitement",
    paragraphs: [
      "Selon la situation, les données sont traitées pour exécuter le service demandé, respecter une obligation légale, protéger les intérêts légitimes liés à la sécurité et à l’amélioration de Forge, ou sur la base du consentement lorsqu’il est requis.",
    ],
  },
  {
    title: "Données des clients de l’artisan",
    paragraphs: [
      "L’artisan détermine les informations de ses clients qu’il enregistre dans Forge et doit les informer conformément à ses propres obligations professionnelles. Forge traite ces données uniquement pour fournir les fonctions demandées et sécuriser le service.",
      "Il convient de ne pas enregistrer d’informations sensibles qui ne seraient pas nécessaires à la gestion de l’intervention ou de la relation client.",
    ],
  },
  {
    title: "Destinataires et prestataires",
    paragraphs: [
      "Les données sont accessibles aux personnes autorisées et aux prestataires techniques strictement nécessaires au fonctionnement de Forge, par exemple pour l’hébergement, l’envoi d’emails, la génération de documents ou les fonctions d’assistance intelligente.",
      "Ces prestataires interviennent dans un cadre contractuel et selon des mesures adaptées de confidentialité et de sécurité. Forge ne vend pas les données personnelles de ses utilisateurs ou de leurs clients.",
    ],
  },
  {
    title: "Durée de conservation",
    paragraphs: [
      "Les informations sont conservées pendant la durée nécessaire à la fourniture du service et à la gestion du compte. Certaines données peuvent être conservées plus longtemps lorsque la loi l’impose, pour établir une preuve ou pour assurer la sécurité du service.",
      "L’utilisateur peut supprimer certains contenus ou demander la fermeture de son compte depuis les options disponibles dans Forge.",
    ],
  },
  {
    title: "Sécurité",
    items: [
      "Contrôle de l’accès aux comptes et gestion sécurisée des sessions.",
      "Mesures destinées à limiter les accès non autorisés et les utilisations abusives.",
      "Protection des échanges et surveillance des incidents techniques.",
      "Accès aux données limité aux besoins nécessaires au fonctionnement du service.",
    ],
  },
  {
    title: "Préférences et stockage local",
    paragraphs: [
      "Forge peut utiliser des cookies ou le stockage local du navigateur pour maintenir la session, mémoriser le thème clair ou sombre et conserver les préférences indispensables au fonctionnement de l’interface.",
    ],
  },
  {
    title: "Vos droits",
    paragraphs: [
      "Selon la réglementation applicable, vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, ainsi que vous opposer à certains traitements. Vous pouvez également retirer un consentement lorsque le traitement repose sur celui-ci.",
      "Ces demandes peuvent être transmises depuis les moyens de contact ou d’assistance disponibles dans Forge. Une vérification d’identité peut être demandée afin de protéger le compte.",
    ],
  },
  {
    title: "Évolution de cette politique",
    paragraphs: [
      "Cette politique peut être mise à jour pour refléter les évolutions de Forge, de ses prestataires ou du cadre réglementaire. La date de mise à jour permet d’identifier la version applicable.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Protection des données"
      title="Politique de confidentialité"
      introduction="Une présentation transparente de la manière dont Forge protège et utilise les informations nécessaires au service."
      updatedAt="27 août 2026"
      sections={sections}
    />
  );
}
