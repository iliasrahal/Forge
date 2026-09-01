"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  LoaderCircle,
  Mic,
  Send,
} from "lucide-react";
import {
  getSpeechRecognitionErrorMessage,
  getSpeechRecognitionStartErrorMessage,
} from "@/src/lib/speechRecognition";

type SpeechRecognitionResultLike = {
  0?: {
    transcript?: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult:
    | ((event: SpeechRecognitionEventLike) => void)
    | null;
  onerror:
    | ((
        event: SpeechRecognitionErrorEventLike,
      ) => void)
    | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () =>
  SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

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


type PendingRequestKind =
  | "intervention"
  | "quote";

type MissingField =
  | "entity"
  | "title"
  | "scheduledDate"
  | "scheduledTime";

type PendingRequest = {
  kind: PendingRequestKind;
  decision: AssistantDecision;
  missingFields: MissingField[];
};

type CreateInterventionResponse = {
  intervention?: {
    id: string;
  };
  clientCreated?: boolean;
  message?: string;
  error?: string;
};

type UpdateInterventionResponse = {
  intervention?: {
    id: string;
  };
  operation?: "reschedule" | "cancel";
  message?: string;
  error?: string;
};

type UpdateClientResponse = {
  client?: {
    id: string;
  };
  message?: string;
  error?: string;
};

type DeleteAllInterventionsResponse = {
  count?: number;
  deletedCount?: number;
  requiresConfirmation?: boolean;
  error?: string;
};

type ForgeBarProps = {
  context?: "home" | "clients" | "quotes" | "invoices";
  variant?: "floating" | "embedded";
  clientId?: string;
  clientName?: string;
  initialMessage?: string;
  onInitialMessageUsed?: () => void;
  onStartReply?: (originalMessage: string) => void;
  onReplyGenerated?: (reply: string) => void;
  onReplyError?: (message: string) => void;
  onAssistantNotice?: (message: string) => void;
  onInterventionCreated?: (
    interventionId: string,
  ) => void;
  onInterventionsDeleted?: (
    scheduledDate: string,
  ) => void;
};

const placeholders = {
  home: [
    "Comment t’aider ?",
    "Répondre à un client ?",
    "Nouvelle intervention ?",
    "Je m’occupe de ça.",
  ],

  clients: [
    "Chercher un client ?",
    "Préparer une réponse ?",
    "Modifier une fiche ?",
    "Créer une intervention ?",
  ],

  quotes: [
    "Créer un devis",
    "Modifier un devis",
    "Envoyer un devis",
    "Télécharger un devis",
    "Créer une intervention depuis ce devis",
  ],

  invoices: [
    "Créer une facture",
    "Modifier une facture",
    "Envoyer une facture",
    "Télécharger une facture",
  ],
};

type DocumentResolution = {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  reference: string;
};

type InvoiceSourceResolution = {
  source: "intervention" | "quote";
  sourceId: string;
};

const technicalErrorPattern =
  /prisma|database|base de données|api|stack|fetch|network|json|sql|server|serveur|internal|timeout|ECONN|P\d{4}/i;

function getUserFacingErrorMessage(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message.trim()
      : "";

  if (
    message &&
    message.length <= 240 &&
    !technicalErrorPattern.test(message)
  ) {
    return message;
  }

  return "Impossible de traiter votre demande pour le moment. Vérifiez votre connexion, puis corrigez votre message si nécessaire et réessayez.";
}

export default function ForgeBar({
  context = "home",
  variant = "floating",
  clientId,
  clientName,
  initialMessage = "",
  onInitialMessageUsed,
  onStartReply,
  onReplyGenerated,
  onReplyError,
  onAssistantNotice,
  onInterventionCreated,
  onInterventionsDeleted,
}: ForgeBarProps) {
  const router = useRouter();

  const photoInputRef =
    useRef<HTMLInputElement | null>(null);

  const [selectedPhotos, setSelectedPhotos] =
    useState<File[]>([]);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  const [
    pendingRequest,
    setPendingRequest,
  ] = useState<PendingRequest | null>(
    null,
  );

  const [
    assistantMessage,
    setAssistantMessage,
  ] = useState("");

  const [isListening, setIsListening] =
    useState(false);
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false);

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null,
    );

  const voiceSubmitTimerRef =
    useRef<number | null>(null);

  const [
    placeholderIndex,
    setPlaceholderIndex,
  ] = useState(0);

  const currentPlaceholders = useMemo(
    () => placeholders[context],
    [context],
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/workspaces", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setIsWorkspaceLocked(data.permissions?.canUseForge === false);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPlaceholderIndex(0);
  }, [context]);

  useEffect(() => {
    if (!initialMessage) {
      return;
    }

    setMessage(initialMessage);
    onInitialMessageUsed?.();
  }, [
    initialMessage,
    onInitialMessageUsed,
  ]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();

      if (voiceSubmitTimerRef.current) {
        window.clearTimeout(
          voiceSubmitTimerRef.current,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (message) {
      return;
    }

    const timer = window.setInterval(() => {
      setPlaceholderIndex((currentIndex) =>
        currentIndex ===
        currentPlaceholders.length - 1
          ? 0
          : currentIndex + 1,
      );
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [message, currentPlaceholders]);

  function handlePhotoSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      return;
    }

    setSelectedPhotos(imageFiles);
  }

  async function detectDecision(
    cleanMessage: string,
  ): Promise<AssistantDecision> {
    const response = await fetch(
      "/api/assistant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        "Je n’ai pas réussi à comprendre votre demande. Essayez par exemple : « J’ai une intervention demain à 10 h. »",
      );
    }

    return {
      intent: data.intent || "unknown",
      action: data.action || "unknown",

      entity:
        typeof data.entity === "string" &&
        data.entity.trim()
          ? data.entity.trim()
          : null,

      title:
        typeof data.title === "string" &&
        data.title.trim()
          ? data.title.trim()
          : null,

      description:
        typeof data.description === "string" &&
        data.description.trim()
          ? data.description.trim()
          : null,

      currentScheduledDate:
        typeof data.currentScheduledDate ===
          "string" &&
        data.currentScheduledDate.trim()
          ? data.currentScheduledDate.trim()
          : null,

      scheduledDate:
        typeof data.scheduledDate ===
          "string" &&
        data.scheduledDate.trim()
          ? data.scheduledDate.trim()
          : null,

      scheduledTime:
        typeof data.scheduledTime ===
          "string" &&
        data.scheduledTime.trim()
          ? data.scheduledTime.trim()
          : null,

      interventionOperation:
        data.interventionOperation ===
          "reschedule" ||
        data.interventionOperation ===
          "cancel"
          ? data.interventionOperation
          : null,

      phone:
        typeof data.phone === "string" &&
        data.phone.trim()
          ? data.phone.trim()
          : null,

      street:
        typeof data.street === "string" &&
        data.street.trim()
          ? data.street.trim()
          : null,

      postalCode:
        typeof data.postalCode ===
          "string" &&
        data.postalCode.trim()
          ? data.postalCode.trim()
          : null,

      city:
        typeof data.city === "string" &&
        data.city.trim()
          ? data.city.trim()
          : null,

      email:
        typeof data.email === "string" &&
        data.email.trim()
          ? data.email.trim()
          : null,

      notes:
        typeof data.notes === "string" &&
        data.notes.trim()
          ? data.notes.trim()
          : null,
    };
  }

  async function generateClientReply(
    cleanMessage: string,
  ) {
    onStartReply?.(cleanMessage);

    const response = await fetch(
      "/api/assistant/reply",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        "Impossible de préparer cette réponse. Vérifiez le message du client puis réessayez.",
      );
    }

    if (!data.reply) {
      throw new Error(
        "Forge n’a pas réussi à préparer la réponse.",
      );
    }

    onReplyGenerated?.(data.reply);
    setMessage("");
  }

  function mergeAssistantDecisions(
    baseDecision: AssistantDecision,
    newDecision: AssistantDecision,
    missingFields: MissingField[],
  ): AssistantDecision {
    const mergedDecision: AssistantDecision = {
      ...baseDecision,
      phone:
        newDecision.phone ??
        baseDecision.phone,
      street:
        newDecision.street ??
        baseDecision.street,
      postalCode:
        newDecision.postalCode ??
        baseDecision.postalCode,
      city:
        newDecision.city ??
        baseDecision.city,
      email:
        newDecision.email ??
        baseDecision.email,
      notes:
        newDecision.notes ??
        baseDecision.notes,
    };

    if (
      missingFields.includes("entity") &&
      newDecision.entity
    ) {
      mergedDecision.entity =
        newDecision.entity;
    }

    if (
      missingFields.includes("title")
    ) {
      mergedDecision.title =
        newDecision.title ??
        newDecision.description ??
        baseDecision.title;

      mergedDecision.description =
        newDecision.description ??
        baseDecision.description;
    }

    if (
      missingFields.includes(
        "scheduledDate",
      ) &&
      newDecision.scheduledDate
    ) {
      mergedDecision.scheduledDate =
        newDecision.scheduledDate;
    }

    if (
      missingFields.includes(
        "scheduledTime",
      ) &&
      newDecision.scheduledTime
    ) {
      mergedDecision.scheduledTime =
        newDecision.scheduledTime;
    }

    return mergedDecision;
  }

  function joinMissingInformation(
    items: string[],
  ) {
    if (items.length === 1) {
      return items[0];
    }

    if (items.length === 2) {
      return `${items[0]} et ${items[1]}`;
    }

    return `${items
      .slice(0, -1)
      .join(", ")} et ${
      items[items.length - 1]
    }`;
  }

  function getInterventionMissingFields(
    decision: AssistantDecision,
  ) {
    const missingFields: MissingField[] =
      [];

    if (!decision.scheduledDate) {
      missingFields.push(
        "scheduledDate",
      );
    }

    return missingFields;
  }

  function getQuoteMissingFields(
    decision: AssistantDecision,
  ) {
    const missingFields: MissingField[] =
      [];

    if (!decision.entity) {
      missingFields.push("entity");
    }

    if (!decision.title) {
      missingFields.push("title");
    }

    return missingFields;
  }

  function getMissingFieldLabel(
    field: MissingField,
    kind: PendingRequestKind,
  ) {
    switch (field) {
      case "entity":
        return "le nom du client";

      case "title":
        return kind === "intervention"
          ? "le motif de l’intervention"
          : "les travaux à prévoir";

      case "scheduledDate":
        return "la date du rendez-vous";

      case "scheduledTime":
        return "l’heure du rendez-vous";
    }
  }

  function askForMissingInformation(
    kind: PendingRequestKind,
    decision: AssistantDecision,
    missingFields: MissingField[],
  ) {
    const requestLabel =
      kind === "intervention"
        ? "cette intervention"
        : "ce devis";

    const missingLabels =
      missingFields.map((field) =>
        getMissingFieldLabel(
          field,
          kind,
        ),
      );

    const notice = `Il manque ${joinMissingInformation(
      missingLabels,
    )} pour créer ${requestLabel}. Complétez votre message, puis renvoyez-le.`;

    setPendingRequest({
      kind,
      decision,
      missingFields,
    });

    setAssistantMessage(notice);
  }

  async function createIntervention(
    decision: AssistantDecision,
  ) {
    const {
      entity,
      title,
      description,
      scheduledDate,
      scheduledTime,
      phone,
      street,
      postalCode,
      city,
    } = decision;

    const missingFields =
      getInterventionMissingFields(
        decision,
      );

    if (missingFields.length > 0) {
      askForMissingInformation(
        "intervention",
        decision,
        missingFields,
      );

      return;
    }

    const response = await fetch(
      "/api/interventions",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          clientName: entity,
          title,
          description,
          scheduledDate,
          scheduledTime,
          phone,
          street,
          postalCode,
          city,
        }),
      },
    );

    const data =
      (await response.json()) as CreateInterventionResponse;

    if (!response.ok) {
      throw new Error(
        "Impossible d’enregistrer cette intervention. Vérifiez les informations indiquées puis réessayez.",
      );
    }

    if (!data.intervention?.id) {
      throw new Error(
        "L’intervention a été créée, mais Forge ne peut pas encore l’afficher.",
      );
    }

    setMessage("");
    setPendingRequest(null);
    setAssistantMessage("");

    onInterventionCreated?.(
      data.intervention.id,
    );

    router.refresh();
  }

  function createQuote(
    decision: AssistantDecision,
  ) {
    const missingFields =
      getQuoteMissingFields(decision);

    if (missingFields.length > 0) {
      askForMissingInformation(
        "quote",
        decision,
        missingFields,
      );

      return;
    }

    const params =
      new URLSearchParams();

    if (decision.entity) {
      params.set(
        "client",
        decision.entity,
      );
    }

    if (decision.title) {
      params.set(
        "title",
        decision.title,
      );
    }

    if (decision.description) {
      params.set(
        "description",
        decision.description,
      );
    }

    setMessage("");
    setPendingRequest(null);
    setAssistantMessage("");

    const queryString =
      params.toString();

    router.push(
      queryString
        ? `/quotes/new?${queryString}`
        : "/quotes/new",
    );
  }

  async function updateIntervention(
    decision: AssistantDecision,
  ) {
    const {
      entity,
      currentScheduledDate,
      scheduledDate,
      scheduledTime,
      interventionOperation,
    } = decision;

    if (!entity) {
      throw new Error(
        "Précise le nom du client concerné.",
      );
    }

    if (!interventionOperation) {
      throw new Error(
        "Précise si tu souhaites reporter ou annuler l’intervention.",
      );
    }

    if (
      interventionOperation ===
        "reschedule" &&
      !scheduledDate
    ) {
      throw new Error(
        "Précise la nouvelle date de l’intervention.",
      );
    }

    if (
      interventionOperation ===
        "reschedule" &&
      !scheduledTime
    ) {
      throw new Error(
        "Précise la nouvelle heure de l’intervention.",
      );
    }

    const response = await fetch(
      "/api/interventions",
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          operation:
            interventionOperation,
          clientName: entity,
          currentScheduledDate,
          scheduledDate,
          scheduledTime,
        }),
      },
    );

    const data =
      (await response.json()) as UpdateInterventionResponse;

    if (!response.ok) {
      throw new Error(
        "Impossible de modifier cette intervention. Vérifiez le client, la date et l’heure puis réessayez.",
      );
    }

    setMessage("");

    if (
      interventionOperation ===
        "reschedule" &&
      data.intervention?.id
    ) {
      onInterventionCreated?.(
        data.intervention.id,
      );
    }

    onAssistantNotice?.(
      data.message ||
        (interventionOperation === "cancel"
          ? `L’intervention de ${entity} a été annulée.`
          : `L’intervention de ${entity} a été reportée.`),
    );

    router.refresh();
  }

  async function deleteAllInterventions(
    decision: AssistantDecision,
  ) {
    if (!decision.scheduledDate) {
      throw new Error(
        "Précise la journée dont tu souhaites supprimer les interventions.",
      );
    }

    const requestDeletion = async (
      confirmed: boolean,
    ) => {
      const response = await fetch(
        "/api/interventions",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            deleteAll: true,
            confirmed,
            scheduledDate:
              decision.scheduledDate,
          }),
        },
      );

      const data =
        (await response.json()) as DeleteAllInterventionsResponse;

      if (!response.ok) {
        throw new Error(
          "Impossible de supprimer les interventions prévues. Vérifiez la journée demandée puis réessayez.",
        );
      }

      return data;
    };

    const preview = await requestDeletion(false);
    const count = preview.count ?? 0;

    if (count === 0) {
      showNotice(
        "Aucune intervention planifiée n’est prévue pour cette journée.",
      );
      return;
    }

    const requestedDate = new Date(
      `${decision.scheduledDate}T00:00:00`,
    );
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(
        2,
        "0",
      ),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    const dayLabel =
      decision.scheduledDate === todayKey
        ? "aujourd’hui"
        : `le ${requestedDate.toLocaleDateString(
            "fr-FR",
          )}`;

    const interventionLabel =
      count > 1
        ? `les ${count} interventions prévues`
        : "l’intervention prévue";

    const confirmed = window.confirm(
      `Tu es sûr de vouloir supprimer ${interventionLabel} ${dayLabel} ?`,
    );

    if (!confirmed) {
      setMessage("");
      return;
    }

    const result = await requestDeletion(true);
    const deletedCount =
      result.deletedCount ?? count;

    onInterventionsDeleted?.(
      decision.scheduledDate,
    );

    showNotice(
      `${deletedCount} intervention${deletedCount > 1 ? "s" : ""} supprimée${deletedCount > 1 ? "s" : ""}.`,
    );
    router.refresh();
  }

  async function updateClient(
    decision: AssistantDecision,
  ) {
    const {
      entity,
      phone,
      email,
      street,
      postalCode,
      city,
      notes,
    } = decision;

  if (!entity) {
    throw new Error(
      "Précise le nom du client concerné.",
    );
  }

  if (
    !phone &&
    !email &&
    !street &&
    !postalCode &&
    !city &&
    !notes
  ) {
    throw new Error(
      "Précise l’information à modifier dans la fiche client.",
    );
  }

  const response = await fetch("/api/clients", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientName: entity,
      phone,
      email,
      street,
      postalCode,
      city,
      notes,
    }),
  });

  const data =
    (await response.json()) as UpdateClientResponse;

  if (!response.ok) {
    throw new Error(
      "Impossible de modifier cette fiche client. Vérifiez les informations indiquées puis réessayez.",
    );
  }

  setMessage("");

  onAssistantNotice?.(
    data.message ||
      `La fiche de ${entity} a été mise à jour.`,
  );

  router.refresh();
}
  function showNotice(notice: string) {
    setAssistantMessage(notice);
    onAssistantNotice?.(notice);
    setMessage("");
  }

  function buildSearchUrl(
    path: "/clients" | "/quotes" | "/invoices",
    entity: string | null,
  ) {
    if (!entity) {
      return path;
    }

    return `${path}?search=${encodeURIComponent(
      entity,
    )}`;
  }

  async function resolveDocument(
    kind: "quote" | "invoice",
    entity: string | null,
  ) {
    const response = await fetch(
      "/api/assistant/documents",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind,
          entity,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.document) {
      throw new Error(
        data.error ||
          `Précise le client ou le numéro du ${kind === "quote" ? "devis" : "facture"} concerné.`,
      );
    }

    return data.document as DocumentResolution;
  }

  async function handleQuoteAction(
    action: AssistantAction,
    entity: string | null,
  ) {
    const quote = await resolveDocument(
      "quote",
      entity,
    );

    setMessage("");

    if (action === "update") {
      router.push(
        `/clients/${quote.clientId}/quotes/${quote.id}/edit`,
      );
      return;
    }

    if (action === "download") {
      window.location.assign(
        `/api/quotes/${quote.id}/pdf`,
      );
      return;
    }

    if (action === "send") {
      const response = await fetch(
        "/api/quotes/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quoteId: quote.id,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error === "email_missing"
            ? "Ce client n’a pas encore d’adresse email. Ajoute-la dans sa fiche puis réessaie."
            : "Impossible d’envoyer ce devis. Vérifie l’adresse email du client puis réessaie.",
        );
      }

      showNotice(`Le devis ${quote.reference} a été envoyé.`);
      router.refresh();
      return;
    }

    if (action === "createIntervention") {
      const params = new URLSearchParams({
        title: quote.title,
      });

      if (quote.description) {
        params.set(
          "description",
          quote.description,
        );
      }

      router.push(
        `/clients/${quote.clientId}/interventions/new?${params.toString()}`,
      );
      return;
    }

    router.push(
      `/clients/${quote.clientId}/quotes/${quote.id}`,
    );
  }

  async function handleInvoiceAction(
    action: AssistantAction,
    entity: string | null,
  ) {
    if (action === "create") {
      if (!entity) {
        throw new Error(
          "Précise le client concerné par la facture.",
        );
      }

      const sourceResponse = await fetch(
        "/api/assistant/documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kind: "invoiceSource",
            entity,
          }),
        },
      );

      const sourceData = await sourceResponse.json();

      if (!sourceResponse.ok || !sourceData.source) {
        throw new Error(
          sourceData.error ||
            "Forge ne trouve aucune intervention terminée ou aucun devis à facturer pour ce client.",
        );
      }

      const source =
        sourceData.source as InvoiceSourceResolution;
      const createResponse = await fetch(
        source.source === "intervention"
          ? "/api/invoices/create-from-intervention"
          : "/api/invoices/create-from-quote",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            source.source === "intervention"
              ? { interventionId: source.sourceId }
              : { quoteId: source.sourceId },
          ),
        },
      );

      const invoiceData = await createResponse.json();

      if (!createResponse.ok || !invoiceData.invoice?.id) {
        throw new Error(
          invoiceData.error ||
            "Impossible de créer cette facture. Vérifie les éléments du client puis réessaie.",
        );
      }

      setMessage("");
      router.push(`/invoices/${invoiceData.invoice.id}`);
      return;
    }

    const invoice = await resolveDocument(
      "invoice",
      entity,
    );

    setMessage("");

    if (action === "download") {
      window.location.assign(
        `/api/invoices/${invoice.id}/pdf`,
      );
      return;
    }

    if (action === "send") {
      const response = await fetch(
        "/api/invoices/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error === "email_missing"
            ? "Ce client n’a pas encore d’adresse email. Ajoute-la dans sa fiche puis réessaie."
            : "Impossible d’envoyer cette facture. Vérifie l’adresse email du client puis réessaie.",
        );
      }

      showNotice(`La facture ${invoice.reference} a été envoyée.`);
      router.refresh();
      return;
    }

    router.push(`/invoices/${invoice.id}`);
  }

  async function handleSubmit(
    messageOverride?: string,
  ) {
    const cleanMessage = (
      messageOverride ?? message
    ).trim();

    if (!cleanMessage || isLoading) {
      return;
    }

    setIsLoading(true);
    onReplyError?.("");

    try {
      if (selectedPhotos.length > 0) {
        onStartReply?.(cleanMessage);

        const formData = new FormData();

        selectedPhotos.forEach((photo) => {
          formData.append("photos", photo);
        });

        formData.append("message", cleanMessage);

        const photoResponse = await fetch(
          "/api/photos",
          {
            method: "POST",
            body: formData,
          },
        );

        const photoData =
          await photoResponse.json();

        if (!photoResponse.ok) {
          throw new Error(
            "Impossible d’analyser ces photos. Vérifiez qu’elles sont lisibles puis réessayez.",
          );
        }

        if (
          typeof photoData.analysis !== "string" ||
          !photoData.analysis.trim()
        ) {
          throw new Error(
            "Forge n’a pas réussi à analyser les photos.",
          );
        }

        if (
          photoData.photoIntent === "quote" &&
          typeof photoData.title === "string" &&
          typeof photoData.description === "string"
        ) {
          const params = new URLSearchParams();

          params.set(
            "title",
            photoData.title.trim(),
          );

          params.set(
            "description",
            photoData.description.trim(),
          );

          setMessage("");
          setSelectedPhotos([]);

          if (photoInputRef.current) {
            photoInputRef.current.value = "";
          }

          if (clientId) {
            router.push(
              `/clients/${clientId}/quotes/new?${params.toString()}`,
            );
          } else {
            if (clientName) {
              params.set("client", clientName);
            }

            router.push(
              `/quotes/new?${params.toString()}`,
            );
          }

          return;
        }

        onReplyGenerated?.(
          photoData.analysis.trim(),
        );

        setMessage("");
        setSelectedPhotos([]);

        if (photoInputRef.current) {
          photoInputRef.current.value = "";
        }

        return;
      }

      const detectedDecision =
        await detectDecision(cleanMessage);

      const decision = pendingRequest
        ? mergeAssistantDecisions(
            pendingRequest.decision,
            detectedDecision,
            pendingRequest.missingFields,
          )
        : detectedDecision;

      const {
        intent,
        action,
        entity,
      } = decision;

      if (pendingRequest) {
        if (
          pendingRequest.kind ===
          "intervention"
        ) {
          await createIntervention(
            decision,
          );
        } else {
          createQuote(decision);
        }

        return;
      }

      switch (`${intent}:${action}`) {
        case "clientReply:reply":
          await generateClientReply(
            cleanMessage,
          );
          break;

        case "quote:create":
          createQuote(decision);
          break;

        case "quote:search":
        case "quote:open":
          router.push(buildSearchUrl("/quotes", entity));
          setMessage("");
          break;

        case "quote:update":
        case "quote:send":
        case "quote:download":
        case "quote:createIntervention":
          await handleQuoteAction(action, entity);
          break;

        case "invoice:create":
        case "invoice:update":
        case "invoice:open":
        case "invoice:send":
        case "invoice:download":
          await handleInvoiceAction(action, entity);
          break;

      case "client:create":
  setMessage("");

  const params = new URLSearchParams();

  if (decision.entity) {
    params.set("name", decision.entity);
  }

  if (decision.phone) {
    params.set("phone", decision.phone);
  }

  if (decision.street) {
    params.set("street", decision.street);
  }

  if (decision.postalCode) {
    params.set("postalCode", decision.postalCode);
  }

  if (decision.city) {
    params.set("city", decision.city);
  }

  if (decision.email) {
    params.set("email", decision.email);
  }

  if (decision.notes) {
    params.set("notes", decision.notes);
  }

  const query = params.toString();

  router.push(
    query
      ? `/clients/new?${query}`
      : "/clients/new",
  );

  break;

        case "client:search":
        case "client:open":
          setMessage("");

          router.push(
            buildSearchUrl(
              "/clients",
              entity,
            ),
          );
          break;

        case "client:update":
          await updateClient(decision);
          break;

        case "intervention:create":
          await createIntervention(
            decision,
          );
          break;

        case "intervention:start":
          showNotice(
            "Tu souhaites démarrer une intervention.",
          );
          break;

        case "intervention:finish":
          showNotice(
            "Tu souhaites terminer une intervention.",
          );
          break;

        case "intervention:open":
          showNotice(
            entity
              ? `Tu souhaites ouvrir l’intervention de ${entity}.`
              : "Tu souhaites ouvrir une intervention.",
          );
          break;

        case "intervention:update":
          await updateIntervention(
            decision,
          );
          break;

        case "intervention:deleteAll":
          await deleteAllInterventions(
            decision,
          );
          break;

        default:
          throw new Error(
            "Je n’ai pas réussi à comprendre votre demande. Essayez par exemple : « J’ai une intervention demain à 10 h. »",
          );
      }
    } catch (error) {
      const errorMessage =
        getUserFacingErrorMessage(error);

      setMessage((currentMessage) =>
        currentMessage.trim()
          ? currentMessage
          : cleanMessage,
      );
      onReplyError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleVoiceInput() {
    if (isLoading || isWorkspaceLocked) {
      return;
    }

    const browserWindow =
      window as SpeechRecognitionWindow;

    const SpeechRecognitionConstructor =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      onReplyError?.(
        "La saisie vocale n’est pas disponible dans ce navigateur. Écrivez votre demande dans le champ, ou réessayez avec un navigateur compatible.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition =
      new SpeechRecognitionConstructor();

    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      onReplyError?.("");
    };

    recognition.onresult = (
      event: SpeechRecognitionEventLike,
    ) => {
      let transcript = "";

      for (
        let index = event.resultIndex ?? 0;
        index < event.results.length;
        index += 1
      ) {
        transcript +=
          event.results[index]?.[0]?.transcript ?? "";
      }

      transcript = transcript.trim();

      if (transcript) {
        setMessage(transcript);

        if (voiceSubmitTimerRef.current) {
          window.clearTimeout(
            voiceSubmitTimerRef.current,
          );
        }

        voiceSubmitTimerRef.current =
          window.setTimeout(() => {
            voiceSubmitTimerRef.current = null;
            void handleSubmit(transcript);
          }, 1000);
      }
    };

    recognition.onerror = (
      event: SpeechRecognitionErrorEventLike,
    ) => {
      if (event.error !== "aborted") {
        onReplyError?.(
          getSpeechRecognitionErrorMessage(
            event.error,
          ),
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setIsListening(false);
      onReplyError?.(
        getSpeechRecognitionStartErrorMessage(
          error,
        ),
      );
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handlePhotoSelection}
        className="hidden"
      />

     <div
       className={`flex h-20 w-full items-center gap-3 px-1 sm:px-2 ${
         variant === "floating"
           ? "forge-bar rounded-3xl border px-5 backdrop-blur-xl"
           : "h-16 gap-2 bg-transparent [&_button]:!h-10 [&_button]:!w-10 [&_button_svg]:!h-5 [&_button_svg]:!w-5 sm:h-20 sm:gap-3 sm:[&_button]:!h-12 sm:[&_button]:!w-12 sm:[&_button_svg]:!h-auto sm:[&_button_svg]:!w-auto"
       }`}
     >
    <input
  type="text"
  value={message}
  onChange={(event) =>
    setMessage(event.target.value)
  }
  onKeyDown={handleKeyDown}
  disabled={isLoading || isListening || isWorkspaceLocked}
  placeholder={
    isListening
      ? "Je t'écoute..."
      : isWorkspaceLocked
        ? "Forge est en lecture seule"
      : isLoading
        ? "Analyse de ta demande..."
        : currentPlaceholders[
            placeholderIndex
          ]
  }
  aria-label="Écrire à Forge"
  className="min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
/>
   <button
  type="button"
  onClick={() =>
    photoInputRef.current?.click()
  }
  aria-label="Ajouter des photos"
  title="Ajouter des photos"
  disabled={isLoading || isWorkspaceLocked}
  className={`flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full transition disabled:opacity-50 ${
    selectedPhotos.length > 0
      ? "bg-blue-600 text-white"
      : "bg-blue-50/90 text-blue-600 shadow-sm ring-1 ring-blue-100 hover:-translate-y-0.5 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700 dark:hover:bg-slate-700"
  }`}
>
  <Camera
    size={25}
    strokeWidth={2.2}
  />
</button>


    <button
      type="button"
      onClick={handleVoiceInput}
      aria-label={
        isListening
          ? "Arrêter l’écoute"
          : "Parler à Forge"
      }
      title={
        isListening
          ? "Arrêter l’écoute"
          : "Parler à Forge"
      }
      disabled={isLoading || isWorkspaceLocked}
      className={`flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full border transition disabled:opacity-50 ${
        isListening
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-blue-600 bg-white/70 text-blue-600 shadow-sm hover:-translate-y-0.5 hover:bg-blue-50 dark:bg-slate-900/70 dark:text-blue-400 dark:hover:bg-slate-800"
      }`}
    >
      {isListening ? (
        <LoaderCircle
          size={25}
          strokeWidth={2.2}
          className="animate-spin"
        />
      ) : (
        <Mic
          size={25}
          strokeWidth={2.2}
        />
      )}
    </button>


    <button
      type="button"
      onClick={() =>
        void handleSubmit()
      }
      disabled={
        !message.trim() || isLoading || isWorkspaceLocked
      }
      aria-label="Envoyer à Forge"
      title="Envoyer"
      className="flex h-12 w-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-700"
    >
      {isLoading ? (
        <LoaderCircle
          size={23}
          strokeWidth={2.2}
          className="animate-spin"
        />
      ) : (
        <Send
          size={23}
          strokeWidth={2.3}
        />
      )}
    </button>
  </div>

  {isWorkspaceLocked && (
    <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
      Consultation disponible. <Link href="/subscription" className="font-semibold text-blue-600 dark:text-blue-400">Activer Forge</Link>
    </p>
  )}


  {assistantMessage && (
    <p className="mx-auto mt-3 max-w-lg rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      {assistantMessage}
    </p>
  )}


  {selectedPhotos.length > 0 && (
    <p className="mt-2 text-center text-sm font-medium text-blue-700 dark:text-blue-300">
      {selectedPhotos.length} photo
      {selectedPhotos.length > 1 ? "s" : ""}{" "}
      sélectionnée
      {selectedPhotos.length > 1 ? "s" : ""}
    </p>
  )}

</div>
  );
}
