"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import HomeContent from "@/components/HomeContent";
import HomeReminders from "@/components/HomeReminders";
import TodayInterventions from "@/components/TodayInterventions";
import UpcomingCalendar, {
  type PlanningClient,
} from "@/components/UpcomingCalendar";
import { type Appointment } from "@/data/appointments";
import { sortActiveTodayAppointments } from "@/src/lib/intervention-calendar";
import type { SmartReminder } from "@/src/lib/smart-reminders";
import { buildInterventionHref } from "@/src/lib/intervention-navigation";
import { resolveFinalizationResumeTarget } from "@/src/lib/intervention-finalization";

type HomeState =
  | "finished"
  | "intervention"
  | "inProgress"
  | "reportInput"
  | "processing"
  | "review"
  | "saved"
  | "clientChoice"
  | "invoiceChoice";

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

type CompleteInterventionResponse = {
  clientId?: string;
  clientName?: string;
  clientIsTemporary?: boolean;
  interventionId?: string;
  error?: string;
};

type HomeClientProps = {
  userFirstName: string;
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  reminders: SmartReminder[];
  planningClients: PlanningClient[];
  todayDateKey: string;
  newInterventionId?: string | null;
  initialPlanningOpen?: boolean;
  initialSelectedInterventionId?: string | null;
  canWrite: boolean;
};

export default function HomeClient({
  userFirstName,
  todayAppointments,
  upcomingAppointments,
  reminders,
  planningClients,
  todayDateKey,
  canWrite,
  newInterventionId: initialNewInterventionId = null,
  initialPlanningOpen = false,
  initialSelectedInterventionId = null,
}: HomeClientProps) {
  const router = useRouter();

  const [homeState, setHomeState] =
  useState<HomeState>("intervention");


const [showExtendModal, setShowExtendModal] =
  useState(false);


const [extendDate, setExtendDate] =
  useState("");

const [extendNotes, setExtendNotes] =
  useState("");

const [extendError, setExtendError] =
  useState("");

const [isExtending, setIsExtending] =
  useState(false);

const [appointmentsList, setAppointmentsList] =
  useState<Appointment[]>(todayAppointments ?? []);

const [upcomingAppointmentsList, setUpcomingAppointmentsList] =
  useState<Appointment[]>(upcomingAppointments ?? []);

const [
  selectedAppointmentId,
  setSelectedAppointmentId,
] = useState<string | null>(
  [...(todayAppointments ?? []), ...(upcomingAppointments ?? [])].some(
    (appointment) => appointment.id === initialSelectedInterventionId,
  )
    ? initialSelectedInterventionId
    : todayAppointments?.find(
    (appointment) =>
      appointment.status === "inProgress",
  )?.id ??
  todayAppointments?.[0]?.id ??
  null
);

const [
  newInterventionId,
  setNewInterventionId,
] = useState<string | null>(initialNewInterventionId);

  const [showGreeting, setShowGreeting] =
    useState(false);
const [showUpcomingCalendar, setShowUpcomingCalendar] =
  useState(initialPlanningOpen);
const [calendarFocusDate, setCalendarFocusDate] =
  useState<string | null>(null);
const [autoOpenNewIntervention, setAutoOpenNewIntervention] =
  useState(false);
const [actionMode, setActionMode] =
  useState<"edit" | null>(null);
const [actionClientName, setActionClientName] = useState("");
const [actionTitle, setActionTitle] = useState("");
const [actionDate, setActionDate] = useState("");
const [actionTime, setActionTime] = useState("");
const [actionEndDate, setActionEndDate] = useState("");
const [actionEndTime, setActionEndTime] = useState("");
const [actionError, setActionError] = useState("");
const [isSavingAction, setIsSavingAction] = useState(false);
const [showAddClientModal, setShowAddClientModal] = useState(false);
const [startClientMode, setStartClientMode] = useState<"existing" | "new">(
  "new",
);
const [startExistingClientId, setStartExistingClientId] = useState(
  planningClients[0]?.id ?? "",
);
const [startClientType, setStartClientType] = useState<"PARTICULIER" | "PROFESSIONNEL">("PARTICULIER");
const [startClientFirstName, setStartClientFirstName] = useState("");
const [startClientLastName, setStartClientLastName] = useState("");
const [startClientCompanyName, setStartClientCompanyName] = useState("");
const [startClientError, setStartClientError] = useState("");
const [isAddingStartClient, setIsAddingStartClient] = useState(false);
  const [
    isInitialWelcomeActive,
    setIsInitialWelcomeActive,
  ] = useState(false);

  const [report, setReport] =
    useState<InterventionReport | null>(null);

  const [reportError, setReportError] =
    useState("");

  const [isValidatingReport, setIsValidatingReport] =
    useState(false);

  const [completedWithReport, setCompletedWithReport] =
    useState(true);

  const [savedClientName, setSavedClientName] =
    useState("");

  const [savedClientId, setSavedClientId] =
    useState<string | null>(null);

  const [completedInterventionId, setCompletedInterventionId] =
    useState<string | null>(null);

  const [nextAppointmentId, setNextAppointmentId] =
    useState<string | null>(null);
const currentAppointment = [
  ...appointmentsList,
  ...upcomingAppointmentsList,
].find(
  (appointment) =>
    appointment.id === selectedAppointmentId,
);

useEffect(() => {

  setAppointmentsList(todayAppointments ?? []);
  setUpcomingAppointmentsList(upcomingAppointments ?? []);


  setSelectedAppointmentId((currentId) => {

    if (isInitialWelcomeActive) {
      return null;
    }


    const currentAppointmentStillExists =
      [
        ...(todayAppointments ?? []),
        ...(upcomingAppointments ?? []),
      ].some(
        (appointment) =>
          appointment.id === currentId,
      );


    if (currentAppointmentStillExists) {
      return currentId;
    }


    return (
      todayAppointments.find(
        (appointment) =>
          appointment.status === "inProgress",
      )?.id ??

      todayAppointments[0]?.id ??
      null
    );

  });


}, [
  todayAppointments,
  upcomingAppointments,
  isInitialWelcomeActive,
]);

useEffect(() => {
  if (!actionMode && !showAddClientModal) {
    return;
  }

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [actionMode, showAddClientModal]);

  useEffect(() => {
  if (!newInterventionId) {
      return;
    }

const newInterventionExists =
  [
    ...(todayAppointments ?? []),
    ...(upcomingAppointments ?? []),
  ].some(
    (appointment) =>
      appointment.id === newInterventionId
  );

    if (!newInterventionExists) {
      return;
    }

    setSelectedAppointmentId(
      newInterventionId
    );

    setReport(null);
    setReportError("");
    const openedAppointment = [
      ...(todayAppointments ?? []),
      ...(upcomingAppointments ?? []),
    ].find((appointment) => appointment.id === newInterventionId);
    setHomeState(openedAppointment?.status === "inProgress" ? "inProgress" : "intervention");

    const futureAppointment = upcomingAppointments.find(
      (appointment) => appointment.id === newInterventionId,
    );

    if (futureAppointment && futureAppointment.status !== "inProgress") {
      setCalendarFocusDate(futureAppointment.date);
      setShowUpcomingCalendar(true);
    }

    const interventionId =
      newInterventionId

    const timer = window.setTimeout(() => {
      const interventionButton =
        document.getElementById(
          `appointment-${interventionId}`,
        );

      interventionButton?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });

     setNewInterventionId(null);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    todayAppointments,
    upcomingAppointments,
    newInterventionId,
  ]);

  useEffect(() => {
    const shouldShowInitialWelcome =
      localStorage.getItem(
        "forgeShowInitialWelcome",
      ) === "true";

    if (shouldShowInitialWelcome) {
      setIsInitialWelcomeActive(true);
      setSelectedAppointmentId(null);
      setHomeState("intervention");
      setShowGreeting(false);

      localStorage.removeItem(
        "forgeShowInitialWelcome",
      );

      return;
    }

    const hasAlreadyOpenedForge =
      localStorage.getItem(
        "forgeHasAlreadyOpened",
      );

    if (!hasAlreadyOpenedForge) {
      setShowGreeting(true);

      localStorage.setItem(
        "forgeHasAlreadyOpened",
        "true",
      );
    }
  }, []);

  const updateCurrentAppointmentStatus = (
    status: Appointment["status"],
    savedReport?: InterventionReport,
  ) => {
    if (!currentAppointment) {
      return;
    }

    setAppointmentsList(
      (previousAppointments) =>
        previousAppointments.map(
          (appointment) =>
            appointment.id ===
            currentAppointment.id
              ? {
                  ...appointment,
                  status,
                  ...(savedReport
                    ? {
                        report: savedReport,
                      }
                    : {}),
                }
              : appointment,
        ),
    );
  };

  const findNextAvailableAppointment = (
    completedAppointmentId: string,
  ) => {
    const completedAppointmentPosition =
      appointmentsList.findIndex(
        (appointment) =>
          appointment.id ===
          completedAppointmentId,
      );

    const appointmentsAfterCurrent =
      appointmentsList.slice(
        completedAppointmentPosition + 1,
      );

    const appointmentsBeforeCurrent =
      appointmentsList.slice(
        0,
        completedAppointmentPosition,
      );

    const remainingAppointments = [
      ...appointmentsAfterCurrent,
      ...appointmentsBeforeCurrent,
    ];

    return remainingAppointments.find(
      (appointment) =>
        appointment.status !== "completed" &&
        appointment.status !== "cancelled",
    );
  };

 const startIntervention = async (clientDetails?: {
  clientType: "PARTICULIER" | "PROFESSIONNEL";
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  address: string;
  title: string;
 }) => {
  if (!currentAppointment) {
    return;
  }

  setReport(null);
  setReportError("");


  // Si l'intervention est déjà en cours,
  // on reprend directement
  if (currentAppointment.status === "inProgress") {
  setReport(null);
  setReportError("");

  setHomeState("inProgress");

  return;
}


  try {
    const response = await fetch(
      "/api/interventions",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "start",
          interventionId:
            currentAppointment.id,
          ...clientDetails,
        }),
      },
    );


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
          "Impossible de démarrer l’intervention.",
      );
    }


    updateCurrentAppointmentStatus(
      "inProgress",
    );

    if (clientDetails) {
      const clientName =
        clientDetails.clientType === "PROFESSIONNEL"
          ? clientDetails.companyName
          : `${clientDetails.firstName} ${clientDetails.lastName}`.trim();

      const updateStartedAppointment = (appointment: Appointment) =>
        appointment.id === currentAppointment.id
          ? {
              ...appointment,
              client: clientName,
              address: clientDetails.address,
              intervention: clientDetails.title,
              hasClient: true,
              status: "inProgress" as const,
            }
          : appointment;

      setAppointmentsList((appointments) =>
        appointments.map(updateStartedAppointment),
      );
      setUpcomingAppointmentsList((appointments) =>
        appointments.map(updateStartedAppointment),
      );
      setShowAddClientModal(false);
    }


    setHomeState("inProgress");


    router.refresh();


  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue.";

    if (clientDetails) {
      setStartClientError(message);
    } else {
      setReportError(message);
    }

  }
};

const handleStartIntervention = async () => {
  if (!currentAppointment) {
    return;
  }

  if (currentAppointment.status === "inProgress") {
    setReport(null);
    setReportError("");
    setHomeState("inProgress");
    return;
  }

  await startIntervention();
};

const handlePrimaryInterventionAction = async () => {
  if (!currentAppointment) {
    return;
  }

  if (
    currentAppointment.status !== "completed" ||
    !currentAppointment.finalizationStep
  ) {
    await handleStartIntervention();
    return;
  }

  setCompletedInterventionId(currentAppointment.id);
  setSavedClientId(currentAppointment.hasClient ? "associated" : null);
  setSavedClientName(currentAppointment.client);
  setCompletedWithReport(
    !currentAppointment.reportWasSkipped,
  );

  const resumeTarget = resolveFinalizationResumeTarget({
    finalizationStep: currentAppointment.finalizationStep,
    finalized: currentAppointment.finalized,
    reportWasSkipped: currentAppointment.reportWasSkipped,
    hasReport: Boolean(currentAppointment.report),
    invoiceId: currentAppointment.invoiceId,
    quoteId: currentAppointment.quoteId,
    clientId: currentAppointment.clientId,
  });

  if (resumeTarget.kind === "invoice" || resumeTarget.kind === "quote") {
    router.push(resumeTarget.href);
  } else if (resumeTarget.kind === "reportReview") {
    setReport(currentAppointment.report ?? null);
    setHomeState("review");
  } else if (resumeTarget.kind === "reportInput") {
    setHomeState("reportInput");
  } else if (resumeTarget.kind === "invoiceChoice") {
    setHomeState("invoiceChoice");
  }
};

const handleAddClientAndStart = async () => {
  if (isAddingStartClient) {
    return;
  }

  if (startClientMode === "existing" && !startExistingClientId) {
    setStartClientError("Sélectionnez un client.");
    return;
  }

  if (startClientMode === "new" &&
    startClientType === "PARTICULIER" &&
    !startClientFirstName.trim()
  ) {
    setStartClientError("Le prénom du client est obligatoire.");
    return;
  }

  if (startClientMode === "new" &&
    startClientType === "PROFESSIONNEL" &&
    !startClientCompanyName.trim()
  ) {
    setStartClientError("Le nom de l’entreprise est obligatoire.");
    return;
  }

  setIsAddingStartClient(true);
  setStartClientError("");

  try {
    const interventionId = completedInterventionId ?? currentAppointment?.id;
    if (!interventionId) {
      throw new Error("Forge ne retrouve pas l’intervention concernée.");
    }

    const response = await fetch("/api/interventions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "attachClient",
        interventionId,
        ...(startClientMode === "existing"
          ? { clientId: startExistingClientId }
          : {
              clientType: startClientType,
              firstName: startClientFirstName.trim(),
              lastName: startClientLastName.trim(),
              companyName: startClientCompanyName.trim(),
            }),
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.clientId) {
      throw new Error(data.error || "Impossible d’associer le client.");
    }

    setSavedClientId(data.clientId);
    setSavedClientName(data.clientName || "");
    setStartClientMode("existing");
    setStartExistingClientId(data.clientId);
    const attachClient = (appointment: Appointment) =>
      appointment.id === interventionId
        ? { ...appointment, client: data.clientName || "", hasClient: true }
        : appointment;
    setAppointmentsList((appointments) => appointments.map(attachClient));
    setUpcomingAppointmentsList((appointments) => appointments.map(attachClient));
    router.refresh();

    const invoiceResponse = await fetch("/api/invoices/create-from-intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interventionId }),
    });
    const invoiceData = await invoiceResponse.json();
    if (!invoiceResponse.ok || !invoiceData.invoice?.id) {
      throw new Error(invoiceData.error || "Impossible de créer la facture.");
    }
    setShowAddClientModal(false);
    router.push(`/invoices/${invoiceData.invoice.id}`);
  } catch (error) {
    setStartClientError(
      error instanceof Error ? error.message : "Une erreur est survenue.",
    );
  } finally {
    setIsAddingStartClient(false);
  }
};
const handleFinishIntervention = () => {

  setReport(null);

  setReportError("");

  setHomeState("reportInput");

  if (currentAppointment) {
    void fetch("/api/interventions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "saveFinalization",
        interventionId: currentAppointment.id,
        finalizationStep: "REPORT_INPUT",
      }),
    });
  }

};


const handleExtendIntervention = () => {

  setExtendDate("");
  setExtendNotes("");
  setExtendError("");

  setShowExtendModal(true);

};

const handleSaveExtension = async () => {
  if (!currentAppointment || !extendDate || isExtending) {
    setExtendError(
      extendDate
        ? "Impossible de retrouver l’intervention."
        : "Choisis une date de fin.",
    );
    return;
  }

  setIsExtending(true);
  setExtendError("");

  try {
    const response = await fetch("/api/interventions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "extend",
        interventionId: currentAppointment.id,
        scheduledDate: extendDate,
        notes: extendNotes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Impossible d’enregistrer la prolongation.",
      );
    }

    setShowExtendModal(false);
    setExtendDate("");
    setExtendNotes("");
    setReportError("");
    router.refresh();
  } catch (error) {
    setExtendError(
      error instanceof Error
        ? error.message
        : "Une erreur est survenue.",
    );
  } finally {
    setIsExtending(false);
  }
};

const handleSaveNotes = async (notes: string) => {
  if (!currentAppointment) {
    throw new Error("Impossible de retrouver l’intervention.");
  }

  const response = await fetch("/api/interventions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operation: "updateNotes",
      interventionId: currentAppointment.id,
      notes,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Impossible d’enregistrer les notes.",
    );
  }

  router.refresh();
};

  const handleSelectAppointment = (
    appointmentId: string,
  ) => {
    setShowUpcomingCalendar(false);
    setIsInitialWelcomeActive(false);
    setSelectedAppointmentId(appointmentId);
    setReport(null);
    setReportError("");
    setHomeState("intervention");
  };

  const openNewInterventionForm = () => {
    setCalendarFocusDate(todayDateKey);
    setAutoOpenNewIntervention(true);
    setShowUpcomingCalendar(true);
  };

  const openCalendar = () => {
    setAutoOpenNewIntervention(false);
    setCalendarFocusDate(
      upcomingAppointmentsList[0]?.date ?? todayDateKey,
    );
    setShowUpcomingCalendar(true);
  };

  const handleCloseUpcomingCalendar = () => {
    setShowUpcomingCalendar(false);
    setAutoOpenNewIntervention(false);
    setSelectedAppointmentId(
      appointmentsList.find(
        (appointment) => appointment.status === "inProgress",
      )?.id ?? appointmentsList[0]?.id ?? null,
    );
  };

  const openInterventionAction = () => {
    if (!currentAppointment) {
      return;
    }

    setActionMode("edit");
    setActionClientName(currentAppointment.client);
    setActionTitle(currentAppointment.intervention);
    setActionDate(currentAppointment.date);
    setActionTime(currentAppointment.time);
    setActionEndDate(currentAppointment.endDate ?? "");
    setActionEndTime(currentAppointment.endTime ?? "");
    setActionError("");
  };

  const handleSaveInterventionAction = async () => {
    if (!currentAppointment || !actionMode || isSavingAction) {
      return;
    }

    setIsSavingAction(true);
    setActionError("");

    try {
      const response = await fetch("/api/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "edit",
          interventionId: currentAppointment.id,
          clientName: actionClientName,
          title: actionTitle,
          scheduledDate: actionDate,
          scheduledTime: actionTime,
          scheduledEndDate: actionEndDate || null,
          scheduledEndTime: actionEndTime || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de modifier l’intervention.");
      }

      setActionMode(null);
      if (actionDate > todayDateKey) {
        setCalendarFocusDate(actionDate);
        setShowUpcomingCalendar(true);
      } else {
        setShowUpcomingCalendar(false);
      }
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleDeleteIntervention = async () => {
    if (
      !currentAppointment ||
      !window.confirm("Supprimer définitivement cette intervention ?\n\nLe planning, les tâches, les temps, les dépenses et les comptes rendus liés seront supprimés. Les devis, factures et paiements existants seront conservés.")
    ) {
      return;
    }

    setActionError("");

    try {
      const response = await fetch("/api/interventions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interventionId: currentAppointment.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de supprimer l’intervention.");
      }

      const deletedId = currentAppointment.id;
      const remainingToday = appointmentsList.filter(
        (appointment) => appointment.id !== deletedId,
      );
      const remainingUpcoming = upcomingAppointmentsList.filter(
        (appointment) => appointment.id !== deletedId,
      );

      setAppointmentsList(remainingToday);
      setUpcomingAppointmentsList(remainingUpcoming);
      setSelectedAppointmentId(
        remainingToday[0]?.id ?? null,
      );
      router.refresh();
    } catch (error) {
      setReportError(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    }
  };

  const handleInterventionsDeleted = (
    scheduledDate: string,
  ) => {
    const keepAppointment = (
      appointment: Appointment,
    ) =>
      appointment.date !== scheduledDate ||
      appointment.status !== "scheduled";

    const remainingToday =
      appointmentsList.filter(
        keepAppointment,
      );
    const remainingUpcoming =
      upcomingAppointmentsList.filter(
        keepAppointment,
      );

    setAppointmentsList(remainingToday);
    setUpcomingAppointmentsList(
      remainingUpcoming,
    );
    setSelectedAppointmentId(
      (currentId) => {
        const currentStillExists = [
          ...remainingToday,
          ...remainingUpcoming,
        ].some(
          (appointment) =>
            appointment.id === currentId,
        );

        if (currentStillExists) {
          return currentId;
        }

        return (
          remainingToday[0]?.id ??
          null
        );
      },
    );
  };

  const handleInterventionCreated = (
    interventionId: string,
  ) => {
    setIsInitialWelcomeActive(false);
    setNewInterventionId(
      interventionId,
    );
  };

  const handlePlanningInterventionCreated = (
    interventionId: string,
    scheduledDate: string,
  ) => {
    setIsInitialWelcomeActive(false);
    setAutoOpenNewIntervention(false);
    setNewInterventionId(interventionId);
    setCalendarFocusDate(scheduledDate);
    setShowUpcomingCalendar(true);
    router.refresh();
  };

  const handleStartProcessing = () => {
    setReport(null);
    setReportError("");
    setHomeState("processing");
  };

  const handleReportGenerated = (
    generatedReport: InterventionReport,
  ) => {
    setReport(generatedReport);
    setReportError("");
    setHomeState("review");
    if (currentAppointment) {
      void fetch("/api/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "saveFinalization",
          interventionId: currentAppointment.id,
          finalizationStep: "REPORT_REVIEW",
          report: generatedReport,
        }),
      });
    }
  };

  const handleReportError = (
    message: string,
  ) => {
    setReportError(message);

    if (!message) {
      return;
    }

    setHomeState("reportInput");
  };

  const handleEditReport = () => {
    setReportError("");
    setHomeState("reportInput");
  };

  const completeIntervention = async (
    completedReport: InterventionReport | null,
  ) => {
    if (!currentAppointment) {
      return;
    }

    if (isValidatingReport) {
      return;
    }

    setIsValidatingReport(true);
    setReportError("");

    try {
      const response = await fetch(
        "/api/interventions",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            operation: "complete",
            interventionId:
              currentAppointment.id,
            ...(completedReport
              ? {
                  reportIntervention:
                    completedReport.intervention,
                  reportDiagnostic:
                    completedReport.diagnostic,
                  reportTravaux:
                    completedReport.travaux,
                  reportRecommendation:
                    completedReport.recommandation,
                }
              : {}),
          }),
        },
      );

      const data =
        (await response.json()) as CompleteInterventionResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Impossible de terminer l’intervention.",
        );
      }

      updateCurrentAppointmentStatus(
        "completed",
        completedReport ?? undefined,
      );

      const nextAppointment =
        findNextAvailableAppointment(
          currentAppointment.id,
        );

      setSavedClientName(
        data.clientName ||
          currentAppointment.client,
      );

      setSavedClientId(
        data.clientId ?? null,
      );

      setCompletedInterventionId(
        currentAppointment.id,
      );

      setCompletedWithReport(Boolean(completedReport));

      setNextAppointmentId(
        nextAppointment?.id ?? null,
      );

      setReport(null);
      setReportError("");
      setHomeState(
        data.clientIsTemporary
          ? "clientChoice"
          : "invoiceChoice",
      );
      router.refresh();
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );

      setHomeState(
        completedReport ? "review" : "reportInput",
      );
    } finally {
      setIsValidatingReport(false);
    }
  };

  const handleValidateReport = async () => {
    if (!report) {
      return;
    }

    await completeIntervention(report);
  };

  const handleSkipReport = async () => {
    await completeIntervention(null);
  };

const handleKeepClient = async () => {

  console.log("CLICK GARDER CLIENT");


  if (!savedClientId) {
    console.error(
      "Aucun client trouvé",
    );
    return;
  }


  try {
console.log("ID CLIENT ENVOYE :", savedClientId);
    const response = await fetch(
      `/api/clients/${savedClientId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          isTemporary: false,
        }),
      },
    );


    if (!response.ok) {
      throw new Error(
        "Impossible de conserver le client.",
      );
    }


    setHomeState("invoiceChoice");


  } catch (error) {

    console.error(
      "Erreur conservation client :",
      error,
    );

  }

};


const handleDeleteTemporaryClient = async () => {
  if (!savedClientId) {
    setReportError("Aucun client trouvé à supprimer.");
    return;
  }

  try {
    const response = await fetch("/api/clients", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId: savedClientId }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Erreur API suppression client :", data);
      setReportError(data.error ?? "Impossible de supprimer la fiche client.");
      return;
    }

    if (data && data.clientId) {
      setSavedClientId(data.clientId);
    }

    setReportError("");
    setHomeState("invoiceChoice");
    router.refresh();
  } catch (error) {
    console.error("Erreur suppression client temporaire :", error);
    setReportError(
      error instanceof Error ? error.message : "Erreur lors de la suppression.",
    );
  }
};



const handleSkipInvoice = () => {
  setSavedClientId(null);
  setCompletedInterventionId(null);

  setHomeState("intervention");

  router.refresh();
};



const handleCreateInvoice = async () => {
  const interventionId =
    completedInterventionId ?? currentAppointment?.id;

  if (!interventionId) {
    setReportError("Forge ne retrouve pas l’intervention concernée.");
    return;
  }

  if (!savedClientId) {
    // Cette étape n'est affichée que pour une intervention réellement sans
    // client : la création rapide est donc le choix naturel par défaut.
    setStartClientMode("new");
    setStartExistingClientId(planningClients[0]?.id ?? "");
    setStartClientType("PARTICULIER");
    setStartClientFirstName("");
    setStartClientLastName("");
    setStartClientCompanyName("");
    setStartClientError("");
    setShowAddClientModal(true);
    return;
  }

  setReportError("");

  try {
    const response = await fetch(
      "/api/invoices/create-from-intervention",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventionId,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.invoice?.id) {
      throw new Error(
        data.error || "Impossible de créer la facture.",
      );
    }

    router.push(`/invoices/${data.invoice.id}`);
  } catch (error) {
    setReportError(
      error instanceof Error
        ? error.message
        : "Impossible de créer la facture.",
    );
  }
};

  const showDashboard =
    homeState === "intervention" &&
    !showUpcomingCalendar &&
    (sortActiveTodayAppointments(appointmentsList).length > 0 ||
      reminders.length > 0);
  const showDashboardAside = !currentAppointment || reminders.length > 0;

  return (
    <main
      className={`flex min-h-0 flex-col overflow-visible px-3 pb-0 sm:min-h-[calc(100dvh-8rem)] sm:px-6 sm:pb-4 ${
        showGreeting
          ? "pt-3 sm:pt-12"
          : showUpcomingCalendar
            ? "pt-2 sm:pt-3"
            : "pt-2 sm:pt-6"
      }`}
    >
      <div className={`mx-auto flex min-h-0 w-full flex-1 flex-col pb-0 sm:pb-4 ${showUpcomingCalendar ? "max-w-3xl" : showDashboard && showDashboardAside ? "max-w-xl lg:max-w-6xl" : "max-w-xl lg:max-w-3xl"}`}>

  <div className={`${showUpcomingCalendar ? "mb-1" : "mb-2 sm:mb-3"} flex shrink-0 flex-row items-center justify-end gap-2 sm:flex-col sm:items-end`}>
    <WorkspaceSwitcher />
    <UserMenu
      firstName={userFirstName}
      showLogout={homeState === "intervention"}
    />
  </div>

  {showDashboard ? (
    <div className={showDashboardAside ? "lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8" : ""}>
      <div className="min-w-0">
        <TodayInterventions
          appointments={appointmentsList}
          selectedAppointmentId={selectedAppointmentId}
          onSelect={handleSelectAppointment}
        />

        <section className={`mt-2 grid min-w-0 gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center ${canWrite ? "grid-cols-2" : "grid-cols-1"}`}>
          {canWrite ? (
            <button
              type="button"
              onClick={openNewInterventionForm}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700 min-[390px]:text-sm sm:px-5 sm:py-2.5 sm:text-base"
            >
              + Nouvelle intervention
            </button>
          ) : null}
          <button
            type="button"
            onClick={openCalendar}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:border-blue-700 min-[390px]:text-sm sm:px-5 sm:py-2.5 sm:text-base"
          >
            Prochainement ({upcomingAppointmentsList.length})
          </button>
        </section>
      </div>

      {showDashboardAside ? (
        <div className="mt-8 min-w-0 lg:mt-0">
          {!currentAppointment ? (
            <div className="mb-5 hidden text-center lg:block">
              <h2 className="text-3xl text-blue-600">
                Salut{userFirstName ? ` ${userFirstName}` : ""},
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-lg font-medium leading-7 text-[var(--forge-text-primary)]">
                Décris-moi ta prochaine intervention.
              </p>
              <p className="mx-auto mt-3 max-w-xs text-sm italic leading-6 text-[var(--forge-text-secondary)]">
                Exemple&nbsp;: J’ai une intervention demain à 10h chez Charles
              </p>
            </div>
          ) : null}
          <HomeReminders reminders={reminders} canWrite={canWrite} />
        </div>
      ) : null}
    </div>
  ) : null}

  {homeState === "intervention" && !showUpcomingCalendar && !showDashboard ? (
    <section className={`mb-2 grid min-w-0 shrink-0 gap-2 sm:mb-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center ${canWrite ? "grid-cols-2" : "grid-cols-1"}`}>
      {canWrite ? (
        <button
          type="button"
          onClick={openNewInterventionForm}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-blue-700 min-[390px]:text-sm sm:px-5 sm:py-2.5 sm:text-base"
        >
          + Nouvelle intervention
        </button>
      ) : null}
      <button
        type="button"
        onClick={openCalendar}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:border-blue-700 min-[390px]:text-sm sm:px-5 sm:py-2.5 sm:text-base"
      >
        Prochainement ({upcomingAppointmentsList.length})
      </button>
    </section>
  ) : null}

  {homeState === "intervention" && showUpcomingCalendar && !autoOpenNewIntervention ? (
    <section className="mb-3 flex min-w-0 shrink-0 items-center justify-center">
      <button
        type="button"
        aria-expanded={true}
        onClick={handleCloseUpcomingCalendar}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition sm:text-base"
      >
        Prochainement ({upcomingAppointmentsList.length})
      </button>
    </section>
  ) : null}

  {homeState === "intervention" && showUpcomingCalendar && (
    <UpcomingCalendar
      key={calendarFocusDate ?? todayDateKey}
      appointments={[
        ...appointmentsList,
        ...upcomingAppointmentsList,
      ]}
      clients={planningClients}
      todayDateKey={todayDateKey}
      focusDate={calendarFocusDate}
      onClose={handleCloseUpcomingCalendar}
      onSelectAppointment={(appointmentId) =>
        router.push(buildInterventionHref(appointmentId, "planning"))
      }
      onInterventionCreated={handlePlanningInterventionCreated}
      canWrite={canWrite}
      autoOpenCreationForm={autoOpenNewIntervention}
    />
  )}


  {showAddClientModal && (
    <div className="forge-modal-overlay fixed inset-x-0 top-0 z-[70] flex h-[calc(100dvh-4.75rem-max(0.5rem,env(safe-area-inset-bottom)))] items-center justify-center overflow-hidden px-2 py-2 sm:h-[calc(100dvh-6rem-max(1rem,env(safe-area-inset-bottom)))] sm:px-4 sm:py-4 lg:left-60 lg:h-dvh">
      <section className="forge-surface flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="shrink-0 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
          <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
            Ajouter un client
          </h2>

          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 sm:mt-2">
            Pour créer la facture, associez d’abord un client à cette intervention.
          </p>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-4 sm:space-y-4 sm:px-6 sm:pb-5">
          {planningClients.length > 0 && (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setStartClientMode("existing")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${startClientMode === "existing" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
              >
                Client existant
              </button>
              <button
                type="button"
                onClick={() => setStartClientMode("new")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${startClientMode === "new" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
              >
                Nouveau client
              </button>
            </div>
          )}

          {startClientMode === "existing" && planningClients.length > 0 ? (
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Client
              <select
                value={startExistingClientId}
                onChange={(event) => setStartExistingClientId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
              >
                {planningClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </label>
          ) : (
          <>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Type de client
            <select
              value={startClientType}
              onChange={(event) =>
                setStartClientType(
                  event.target.value as
                    | "PARTICULIER"
                    | "PROFESSIONNEL",
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="PARTICULIER">Particulier</option>
              <option value="PROFESSIONNEL">Professionnel</option>
            </select>
          </label>

          {startClientType === "PARTICULIER" ? (
            <>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Prénom
                <input
                  required
                  value={startClientFirstName}
                  onChange={(event) =>
                    setStartClientFirstName(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Nom
                <input
                  value={startClientLastName}
                  onChange={(event) =>
                    setStartClientLastName(
                      event.target.value,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </>
          ) : (
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Nom de l&apos;entreprise
              <input
                required
                value={startClientCompanyName}
                onChange={(event) =>
                  setStartClientCompanyName(
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          )}
          </>
          )}

          {startClientError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {startClientError}
            </p>
          )}
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-3 min-[360px]:grid-cols-2 sm:gap-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => setShowAddClientModal(false)}
            disabled={isAddingStartClient}
            className="rounded-xl border border-slate-200 px-4 py-3 font-semibold dark:border-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleAddClientAndStart}
            disabled={isAddingStartClient}
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {isAddingStartClient ? "Création…" : "Ajouter et créer la facture"}
          </button>
        </footer>
      </section>
    </div>
  )}


  {actionMode && currentAppointment && (
    <div className="forge-modal-overlay fixed inset-x-0 top-0 z-[70] flex h-[calc(100dvh-4.75rem-max(0.5rem,env(safe-area-inset-bottom)))] items-start justify-center overflow-y-auto overscroll-contain px-2 py-2 sm:h-[calc(100dvh-6rem-max(1rem,env(safe-area-inset-bottom)))] sm:px-4 sm:py-4 lg:left-60 lg:h-dvh lg:items-center">
      <section className="forge-surface my-auto w-full max-w-md rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:p-6">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          Modifier l’intervention
        </h2>

        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          {actionMode === "edit" && (
            <>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Client
                <input
                  value={actionClientName}
                  onChange={(event) => setActionClientName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Titre
                <input
                  value={actionTitle}
                  onChange={(event) => setActionTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </>
          )}

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Date
            <input
              type="date"
              value={actionDate}
              onChange={(event) => setActionDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Heure
            <input
              type="time"
              step={60}
              value={actionTime}
              onChange={(event) => setActionTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          <div className="grid gap-4 min-[360px]:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Date de fin <span className="font-normal text-slate-400">(facultatif)</span>
              <input
                type="date"
                min={actionDate}
                value={actionEndDate}
                onChange={(event) => setActionEndDate(event.target.value)}
                className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Heure de fin <span className="font-normal text-slate-400">(facultatif)</span>
              <input
                type="time"
                step={60}
                value={actionEndTime}
                onChange={(event) => setActionEndTime(event.target.value)}
                disabled={!actionEndDate}
                className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>

          {actionError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-3 min-[360px]:grid-cols-2 sm:mt-6">
          <button
            type="button"
            onClick={() => setActionMode(null)}
            disabled={isSavingAction}
            className="rounded-xl border border-slate-200 px-4 py-3 font-semibold dark:border-slate-700"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSaveInterventionAction}
            disabled={isSavingAction}
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {isSavingAction ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </section>
    </div>
  )}



  <HomeContent

    state={homeState}
    canWrite={canWrite}

    hideMainContent={showUpcomingCalendar}
    hideForgeBar={Boolean(actionMode) || showAddClientModal}
    hideGreetingOnDesktop={showDashboard}

    currentAppointment={
      currentAppointment
    }

    report={report}

    error={reportError}

    isValidatingReport={isValidatingReport}

    savedClientName={
      savedClientName
    }

    completedWithReport={completedWithReport}
    initialReportDraft={currentAppointment?.reportDraft ?? ""}
    onReportDraftChange={(draft) => {
      if (!currentAppointment) return;
      void fetch("/api/interventions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "saveFinalization",
          interventionId: currentAppointment.id,
          finalizationStep: "REPORT_INPUT",
          reportDraft: draft,
        }),
      });
    }}


    onStartIntervention={
      handlePrimaryInterventionAction
    }

    onEditIntervention={openInterventionAction}

    onDeleteIntervention={handleDeleteIntervention}


    onFinishIntervention={
      handleFinishIntervention
    }


    onExtendIntervention={
      handleExtendIntervention
    }

    onSaveNotes={handleSaveNotes}


    onStartProcessing={
      handleStartProcessing
    }


    onReportGenerated={
      handleReportGenerated
    }


    onReportError={
      handleReportError
    }


    onEditReport={
      handleEditReport
    }


    onValidateReport={
      handleValidateReport
    }

    onSkipReport={
      handleSkipReport
    }


    onInterventionCreated={
      handleInterventionCreated
    }


    onInterventionsDeleted={
      handleInterventionsDeleted
    }


    onKeepClient={
      handleKeepClient
    }


    onDeleteTemporaryClient={
      handleDeleteTemporaryClient
    }


    onSkipInvoice={
      handleSkipInvoice
    }


      onCreateInvoice={
          handleCreateInvoice
    }

  />

  {showExtendModal && (

    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">

      <div className="forge-surface max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:p-6">

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Prolonger l&apos;intervention
        </h2>

        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Choisis la nouvelle date de fin de l&apos;intervention.
        </p>

        <input
          type="date"
          value={extendDate}
          onChange={(e) =>
            setExtendDate(e.target.value)
          }
          className="mt-5 w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        <label
          htmlFor="extend-notes"
          className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          Notes
        </label>

        <textarea
          id="extend-notes"
          value={extendNotes}
          onChange={(event) => setExtendNotes(event.target.value)}
          placeholder="Ce que tu as fait ou ce qu'il reste à faire..."
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
        />

        {extendError && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {extendError}
          </p>
        )}

        <div className="mt-6 grid gap-3 min-[360px]:grid-cols-2">

          <button
            type="button"
            onClick={() => {
              setShowExtendModal(false);
              setExtendDate("");
            }}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold dark:border-slate-700"
          >
            Annuler
          </button>


          <button
            type="button"
            onClick={() => {
              void handleSaveExtension();
            }}
            disabled={isExtending}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExtending ? "Enregistrement..." : "Prolonger"}
          </button>

        </div>

      </div>

    </div>

  )}

      </div>

    </main>
  );
}
