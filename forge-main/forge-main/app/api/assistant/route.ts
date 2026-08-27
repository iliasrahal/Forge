import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AssistantIntent =
  | "clientReply"
  | "quote"
  | "invoice"
  | "client"
  | "intervention"
  | "unknown";

type AssistantAction =
  | "reply"
  | "create"
  | "search"
  | "open"
  | "update"
  | "start"
  | "finish"
  | "deleteAll"
  | "send"
  | "download"
  | "createIntervention"
  | "unknown";

type InterventionOperation =
  | "reschedule"
  | "cancel"
  | null;

type AssistantDecision = {
  intent: AssistantIntent;
  action: AssistantAction;
  entity: string | null;
  title: string | null;
  description: string | null;

  currentScheduledDate: string | null;
  scheduledDate: string | null;
  scheduledTime: string | null;

  interventionOperation: InterventionOperation;

  phone: string | null;
  street: string | null;
  postalCode: string | null;
  city: string | null;
  email: string | null;
  notes: string | null;
};

function getCurrentFrenchDate() {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentFrenchDateLabel() {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

function getNextWeekdayDate(
  weekday: number,
  nextWeek = false,
) {
  const now = new Date();

  const parisDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Europe/Paris",
    }),
  );

  const currentDay =
    parisDate.getDay();

  let daysUntil =
    weekday - currentDay;

  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  if (nextWeek) {
    daysUntil += 7;
  }

  parisDate.setDate(
    parisDate.getDate() + daysUntil,
  );

  return parisDate
    .toISOString()
    .slice(0, 10);
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : null;
}

function cleanDate(value: unknown) {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  return null;
}

function cleanTime(value: unknown) {
  if (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  ) {
    return value;
  }

  return null;
}

function cleanPostalCode(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  return /^\d{5}$/.test(cleanedValue)
    ? cleanedValue
    : null;
}

function cleanInterventionOperation(
  value: unknown,
): InterventionOperation {
  if (
    value === "reschedule" ||
    value === "cancel"
  ) {
    return value;
  }

  return null;
}

function containsRdvAlias(
  message: string,
  intent: AssistantIntent,
  action: AssistantAction,
) {
  if (
    intent === "clientReply" ||
    intent === "quote" ||
    intent === "invoice" ||
    intent === "client" ||
    action !== "unknown" &&
      action !== "create"
  ) {
    return false;
  }

  return /\brdv\b/i.test(message);
}

function requestsDeleteAllInterventions(
  message: string,
) {
  const normalizedMessage = message
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const requestsDeletion =
    /\b(supprime|retire|annule|efface)\b/.test(
      normalizedMessage,
    );
  const targetsWholeDay =
    /\b(toutes?|tous|planning|journee)\b/.test(
      normalizedMessage,
    );
  const targetsInterventions =
    /\b(interventions?|rendez-vous|rdv|planning)\b/.test(
      normalizedMessage,
    );

  return (
    requestsDeletion &&
    targetsWholeDay &&
    targetsInterventions
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "La demande est obligatoire.",
        },
        {
          status: 400,
        },
      );
    }

    const currentDate =
      getCurrentFrenchDate();

    const currentDateLabel =
      getCurrentFrenchDateLabel();

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
Tu es le routeur d’intention de Forge, un assistant administratif pour plombiers et chauffagistes.

Nous sommes le ${currentDateLabel}.
La date actuelle en France est ${currentDate}.

Analyse la demande de l’artisan et retourne toujours les champs suivants.

1. intent :
- clientReply : préparer une réponse à un SMS, un mail, WhatsApp ou un message client.
- quote : créer, rechercher, ouvrir, modifier, envoyer ou télécharger un devis, ou créer une intervention depuis un devis.
- invoice : créer, rechercher, ouvrir, modifier, envoyer ou télécharger une facture.
- client : créer, rechercher, ouvrir ou modifier une fiche client.
- intervention : créer, rechercher, ouvrir, reporter, annuler, démarrer, terminer ou modifier une intervention.
- unknown : la demande ne correspond clairement à aucune catégorie.

2. action :
- reply : préparer une réponse client.
- create : créer un élément.
- search : rechercher un élément.
- open : ouvrir ou consulter un élément existant.
- update : reporter, annuler ou modifier un élément existant.
- start : démarrer une intervention.
- finish : terminer une intervention.
- deleteAll : supprimer toutes les interventions planifiées d’une journée.
- send : envoyer un devis ou une facture au client.
- download : télécharger le PDF d’un devis ou d’une facture.
- createIntervention : créer une intervention depuis un devis existant.
- unknown : l’action n’est pas suffisamment claire.

Règles documents :
- « facture », « FAC-123 » et toute demande portant explicitement sur une facture correspondent à intent = "invoice".
- « devis » et toute demande portant explicitement sur un devis correspondent à intent = "quote".
- « envoie le devis/la facture » correspond à action = "send".
- « télécharge le devis/la facture » correspond à action = "download".
- « transforme ce devis en intervention » et « crée une intervention depuis ce devis » correspondent à intent = "quote", action = "createIntervention".

- « rdv » est un alias de rendez-vous : « j’ai rdv aujourd’hui à 19h » correspond à intent = "intervention", action = "create", scheduledDate = la date d’aujourd’hui et scheduledTime = "19:00".
- « supprime toutes les interventions de la journée », « retire tous mes rdv », « annule toutes les interventions prévues aujourd’hui » et « efface mon planning » correspondent à intent = "intervention" et action = "deleteAll". scheduledDate contient la journée demandée, ou la date d’aujourd’hui lorsque la demande dit seulement « la journée » ou « mon planning d’aujourd’hui ».

3. entity :
- Contient uniquement le nom du client, le nom de société ou la référence précise concernée.
- Ne mets jamais le téléphone, l’adresse, l’e-mail, la note, le motif, la date ou l’heure dans entity.
- Si aucun client ou élément précis n’est indiqué, retourne null.
- N’invente jamais un nom ou une référence.

4. title et description :
- Pour une création de devis, title contient un titre court et professionnel.
- Pour une création d’intervention, title contient le motif court de l’intervention.
- description contient une description claire et fidèle à la demande.
- Pour une création d’intervention, title et description peuvent être null si aucun motif n’est indiqué.
- Pour un report ou une annulation, retourne null si aucun nouveau motif n’est demandé.
- Ne mets pas les coordonnées du client dans title ou description.
- N’invente jamais de détail absent.

5. currentScheduledDate :
- Utilisé pour retrouver une intervention existante lors d’un report ou d’une annulation.
- Contient la date actuelle de l’intervention au format YYYY-MM-DD.
- Exemple : dans "Reporte l’intervention de demain à vendredi", currentScheduledDate correspond à demain.
- Exemple : dans "Annule l’intervention de Jean Martin de lundi", currentScheduledDate correspond à lundi.
- Si la date actuelle de l’intervention n’est pas indiquée, retourne null.
- Ne confonds jamais cette date avec la nouvelle date du report.

6. scheduledDate :
- Pour une création, contient la date prévue de l’intervention.
- Pour un report, contient uniquement la nouvelle date.
- Retourne la date exacte au format YYYY-MM-DD.
- Comprends aujourd’hui, demain, après-demain, jeudi, dimanche prochain et lundi de la semaine prochaine.
- "Jeudi" signifie le prochain jeudi à venir.
- "Jeudi prochain" signifie le jeudi de la semaine suivante.
- Pour une annulation, retourne null.
- Si aucune nouvelle date n’est précisée, retourne null.

7. scheduledTime :
- Pour une création, contient l’heure prévue.
- Pour un report, contient la nouvelle heure.
- Retourne l’heure au format HH:mm.
- "10h" devient "10:00".
- "14h30" devient "14:30".
- Pour une annulation, retourne null.
- Pour matin, après-midi ou soir sans heure précise, retourne null.
- Une création d’intervention reste valide lorsque scheduledTime est null.

8. interventionOperation :
- "reschedule" lorsque l’artisan veut reporter ou déplacer une intervention.
- "cancel" lorsque l’artisan veut annuler une intervention.
- null pour les créations, recherches, ouvertures, démarrages et fins d’intervention.

9. phone :
- Contient uniquement le numéro de téléphone du client.
- Exemple : "0612345678" devient "06 12 34 56 78".
- Si aucun numéro n’est indiqué, retourne null.
- N’invente jamais de numéro.

10. street :
- Contient uniquement le numéro et le nom de la voie.
- Ne mets pas le code postal ou la ville dans street.
- Si aucune rue n’est indiquée, retourne null.
- N’invente jamais d’adresse.

11. postalCode :
- Contient uniquement le code postal français à 5 chiffres.
- Si aucun code postal n’est indiqué, retourne null.
- N’invente jamais de code postal.

12. city :
- Contient uniquement le nom de la ville.
- Si aucune ville n’est indiquée, retourne null.
- N’invente jamais de ville.

13. email :
- Contient uniquement l’adresse e-mail du client.
- Si aucun e-mail n’est indiqué, retourne null.
- N’invente jamais d’adresse e-mail.

14. notes :
- Contient uniquement une note libre concernant le client.
- Exemples :
  "Prévenir avant de venir."
  "Le portail est toujours fermé."
  "Le client préfère être appelé après 17h."
- Ne mets pas les autres informations de la demande dans notes.
- Si aucune note n’est indiquée, retourne null.

Règles pour une mise à jour client :
- Une phrase qui donne un nouveau téléphone, un e-mail, une adresse ou une note pour un client existant correspond à :
  intent = "client"
  action = "update"
- Le nom du client doit être placé dans entity.
- Les informations à enregistrer doivent être placées dans les champs correspondants.
- N’utilise pas title ou description pour une mise à jour de fiche client.

Exemples :

"Crée une intervention demain à 9h chez Marc Leroy pour une fuite."
{
  "intent": "intervention",
  "action": "create",
  "entity": "Marc Leroy",
  "title": "Fuite",
  "description": "Intervention pour une fuite.",
  "currentScheduledDate": null,
  "scheduledDate": "DATE_CALCULÉE_DE_DEMAIN",
  "scheduledTime": "09:00",
  "interventionOperation": null,
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Crée une intervention demain à 9h chez Marc Leroy, téléphone 06 12 34 56 78, au 18 rue des Lilas, 69003 Lyon, pour une fuite."
{
  "intent": "intervention",
  "action": "create",
  "entity": "Marc Leroy",
  "title": "Fuite",
  "description": "Intervention pour une fuite.",
  "currentScheduledDate": null,
  "scheduledDate": "DATE_CALCULÉE_DE_DEMAIN",
  "scheduledTime": "09:00",
  "interventionOperation": null,
  "phone": "06 12 34 56 78",
  "street": "18 rue des Lilas",
  "postalCode": "69003",
  "city": "Lyon",
  "email": null,
  "notes": null
}

"Reporte l’intervention de Jean Martin de demain à vendredi à 14h."
{
  "intent": "intervention",
  "action": "update",
  "entity": "Jean Martin",
  "title": null,
  "description": null,
  "currentScheduledDate": "DATE_CALCULÉE_DE_DEMAIN",
  "scheduledDate": "DATE_CALCULÉE_DE_VENDREDI",
  "scheduledTime": "14:00",
  "interventionOperation": "reschedule",
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Reporte l’intervention de Jean Martin à lundi prochain à 10h."
{
  "intent": "intervention",
  "action": "update",
  "entity": "Jean Martin",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": "DATE_CALCULÉE_DE_LUNDI_PROCHAIN",
  "scheduledTime": "10:00",
  "interventionOperation": "reschedule",
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Annule l’intervention de Paul Durand de demain."
{
  "intent": "intervention",
  "action": "update",
  "entity": "Paul Durand",
  "title": null,
  "description": null,
  "currentScheduledDate": "DATE_CALCULÉE_DE_DEMAIN",
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": "cancel",
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Annule l’intervention de Paul Durand."
{
  "intent": "intervention",
  "action": "update",
  "entity": "Paul Durand",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": "cancel",
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Commence l’intervention."
{
  "intent": "intervention",
  "action": "start",
  "entity": null,
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Le nouveau numéro de Marc Leroy est le 06 12 34 56 78."
{
  "intent": "client",
  "action": "update",
  "entity": "Marc Leroy",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": "06 12 34 56 78",
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

"Le nouveau mail de Marc Leroy est marc@gmail.com."
{
  "intent": "client",
  "action": "update",
  "entity": "Marc Leroy",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": "marc@gmail.com",
  "notes": null
}

"Marc Leroy habite maintenant au 15 rue Victor Hugo, 59000 Lille."
{
  "intent": "client",
  "action": "update",
  "entity": "Marc Leroy",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": null,
  "street": "15 rue Victor Hugo",
  "postalCode": "59000",
  "city": "Lille",
  "email": null,
  "notes": null
}

"Ajoute une note pour Marc Leroy : prévenir avant de venir."
{
  "intent": "client",
  "action": "update",
  "entity": "Marc Leroy",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": null,
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": "Prévenir avant de venir."
}

Réponds uniquement avec un JSON valide contenant toujours tous les champs :

{
  "intent": "client",
  "action": "update",
  "entity": "Marc Leroy",
  "title": null,
  "description": null,
  "currentScheduledDate": null,
  "scheduledDate": null,
  "scheduledTime": null,
  "interventionOperation": null,
  "phone": "06 12 34 56 78",
  "street": null,
  "postalCode": null,
  "city": null,
  "email": null,
  "notes": null
}

N’ajoute aucun texte avant ou après le JSON.
            `.trim(),
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0,
        response_format: {
          type: "json_object",
        },
      });

    const content =
      completion.choices[0]?.message
        ?.content;

    if (!content) {
      throw new Error(
        "Aucune décision n’a été détectée.",
      );
    }

    const parsed = JSON.parse(
      content,
    ) as Partial<AssistantDecision>;

    if (
  message.toLowerCase().includes(
    "jeudi prochain",
  )
) {
  parsed.scheduledDate =
    getNextWeekdayDate(4, true);
}


if (
  message.toLowerCase().includes(
    "jeudi",
  ) &&
  !message.toLowerCase().includes(
    "jeudi prochain",
  )
) {
  parsed.scheduledDate =
    getNextWeekdayDate(4);
}

    const allowedIntents: AssistantIntent[] =
      [
        "clientReply",
        "quote",
        "invoice",
        "client",
        "intervention",
        "unknown",
      ];

    const allowedActions: AssistantAction[] =
      [
        "reply",
        "create",
        "search",
        "open",
        "update",
        "start",
        "finish",
        "deleteAll",
        "send",
        "download",
        "createIntervention",
        "unknown",
      ];

    const intent =
      parsed.intent &&
      allowedIntents.includes(parsed.intent)
        ? parsed.intent
        : "unknown";

    const action =
      parsed.action &&
      allowedActions.includes(parsed.action)
        ? parsed.action
        : "unknown";

    const deleteAllRequested =
      requestsDeleteAllInterventions(
        message,
      );

    const hasRdvAlias =
      containsRdvAlias(
        message,
        intent,
        action,
      );

    const resolvedIntent: AssistantIntent =
      deleteAllRequested
        ? "intervention"
        : hasRdvAlias
        ? "intervention"
        : intent;

    const resolvedAction: AssistantAction =
      deleteAllRequested
        ? "deleteAll"
        : hasRdvAlias
        ? "create"
        : action;

    const entity = cleanOptionalString(
      parsed.entity,
    );

    const title = cleanOptionalString(
      parsed.title,
    );

    const description =
      cleanOptionalString(
        parsed.description,
      );

    const currentScheduledDate = cleanDate(
      parsed.currentScheduledDate,
    );

    const scheduledDate =
      cleanDate(parsed.scheduledDate) ||
      (deleteAllRequested
        ? currentDate
        : null);

    const scheduledTime = cleanTime(
      parsed.scheduledTime,
    );

    const interventionOperation =
      cleanInterventionOperation(
        parsed.interventionOperation,
      );

    const phone = cleanOptionalString(
      parsed.phone,
    );

    const street = cleanOptionalString(
      parsed.street,
    );

    const postalCode = cleanPostalCode(
      parsed.postalCode,
    );

    const city = cleanOptionalString(
      parsed.city,
    );

    const email = cleanOptionalString(
      parsed.email,
    );

    const notes = cleanOptionalString(
      parsed.notes,
    );

    return NextResponse.json({
      intent: resolvedIntent,
      action: resolvedAction,
      entity,
      title,
      description,
      currentScheduledDate,
      scheduledDate,
      scheduledTime,
      interventionOperation,
      phone,
      street,
      postalCode,
      city,
      email,
      notes,
    });
  } catch (error) {
    console.error(
      "Erreur lors de l’analyse de la demande :",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Impossible de comprendre la demande pour le moment.",
      },
      {
        status: 500,
      },
    );
  }
}
