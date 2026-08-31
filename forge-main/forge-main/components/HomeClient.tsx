"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import HomeContent from "@/components/HomeContent";
import UpcomingCalendar, {
  type PlanningClient,
} from "@/components/UpcomingCalendar";
import {
  getAppointmentDateLabel,
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";

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
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
  planningClients: PlanningClient[];
  todayDateKey: string;
  newInterventionId?: string | null;
};

export default function HomeClient({
  todayAppointments,
  upcomingAppointments,
  planningClients,
  todayDateKey,
  newInterventionId: initialNewInterventionId = null,
}: HomeClientProps) {
  const router = useRouter();

  const appointmentsContainerRef =
    useRef<HTMLDivElement | null>(null);

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
  todayAppointments?.find(
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
  useState(false);
const [calendarFocusDate, setCalendarFocusDate] =
  useState<string | null>(null);
const [actionMode, setActionMode] =
  useState<"edit" | null>(null);
const [actionClientName, setActionClientName] = useState("");
const [actionTitle, setActionTitle] = useState("");
const [actionDate, setActionDate] = useState("");
const [actionTime, setActionTime] = useState("");
const [actionError, setActionError] = useState("");
const [isSavingAction, setIsSavingAction] = useState(false);
const [showAddClientModal, setShowAddClientModal] = useState(false);
const [startClientType, setStartClientType] = useState<"PARTICULIER" | "PROFESSIONNEL">("PARTICULIER");
const [startClientFirstName, setStartClientFirstName] = useState("");
const [startClientLastName, setStartClientLastName] = useState("");
const [startClientCompanyName, setStartClientCompanyName] = useState("");
const [startInterventionTitle, setStartInterventionTitle] = useState("");
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
    setHomeState("intervention");

    const futureAppointment = upcomingAppointments.find(
      (appointment) => appointment.id === newInterventionId,
    );

    if (futureAppointment) {
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

  const getAppointmentStatusLabel = (
    status: Appointment["status"],
  ) => {
    switch (status) {
      case "inProgress":
        return "En cours";

      case "completed":
        return "Terminée";

      case "postponed":
        return "Reportée";

      case "cancelled":
        return "Annulée";

      default:
        return "À faire";
    }
  };

  const getAppointmentStatusClasses = (
    status: Appointment["status"],
    isSelected: boolean,
  ) => {
    if (isSelected) {
      return "bg-blue-100 text-blue-700";
    }

    switch (status) {
      case "inProgress":
        return "bg-blue-100 text-blue-700";

      case "completed":
        return "bg-green-100 text-green-700";

      case "postponed":
        return "bg-amber-100 text-amber-700";

      case "cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
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

  if (!currentAppointment.hasClient) {
    setStartClientType("PARTICULIER");
    setStartClientFirstName("");
    setStartClientLastName("");
    setStartClientCompanyName("");
    setStartInterventionTitle(
      getAppointmentSubject(currentAppointment),
    );
    setStartClientError("");
    setShowAddClientModal(true);
    return;
  }

  await startIntervention();
};

const handleAddClientAndStart = async () => {
  if (isAddingStartClient) {
    return;
  }

  if (
    startClientType === "PARTICULIER" &&
    (!startClientFirstName.trim() || !startClientLastName.trim())
  ) {
    setStartClientError("Le prénom et le nom du client sont obligatoires.");
    return;
  }

  if (
    startClientType === "PROFESSIONNEL" &&
    !startClientCompanyName.trim()
  ) {
    setStartClientError("Le nom de l’entreprise est obligatoire.");
    return;
  }

  if (!startInterventionTitle.trim()) {
    setStartClientError("Le motif de l’intervention est obligatoire.");
    return;
  }

  setIsAddingStartClient(true);
  setStartClientError("");

  try {
    await startIntervention({
      clientType: startClientType,
      firstName: startClientFirstName.trim(),
      lastName: startClientLastName.trim(),
      companyName: startClientCompanyName.trim(),
      phone: "",
      address: "",
      title: startInterventionTitle.trim(),
    });
  } finally {
    setIsAddingStartClient(false);
  }
};
const handleFinishIntervention = () => {

  setReport(null);

  setReportError("");

  setHomeState("reportInput");

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

  const handleCloseUpcomingCalendar = () => {
    setShowUpcomingCalendar(false);
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
      !window.confirm("Supprimer définitivement cette intervention ?")
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

  const handleValidateReport =
    async () => {
      if (!currentAppointment || !report) {
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
              reportIntervention:
                report.intervention,
              reportDiagnostic:
                report.diagnostic,
              reportTravaux:
                report.travaux,
              reportRecommendation:
                report.recommandation,
            }),
          },
        );

        const data =
          (await response.json()) as CompleteInterventionResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Impossible d’enregistrer le compte rendu.",
          );
        }

        updateCurrentAppointmentStatus(
          "completed",
          report,
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

        setHomeState("review");
      } finally {
        setIsValidatingReport(false);
      }
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

  return (
    <main
      className={`flex min-h-[calc(100dvh-8rem)] flex-col overflow-visible bg-white px-3 pb-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 ${
        showGreeting
          ? "pt-8 sm:pt-12"
          : showUpcomingCalendar
            ? "pt-2 sm:pt-3"
            : "pt-4 sm:pt-6"
      }`}
    >
      <div className={`mx-auto flex min-h-0 w-full flex-1 flex-col pb-4 ${showUpcomingCalendar ? "max-w-3xl" : "max-w-xl"}`}>

  <div className={`${showUpcomingCalendar ? "mb-1" : "mb-3"} flex shrink-0 justify-end`}>
    <UserMenu showLogout={homeState === "intervention"} />
  </div>


  {homeState === "intervention" &&
    !showUpcomingCalendar &&
    appointmentsList.length > 0 && (

      <section className="mb-3 min-w-0 shrink-0">

        <div
          ref={appointmentsContainerRef}
          className="flex w-full gap-2 overflow-x-auto pb-1"
        >

          {appointmentsList.map((appointment) => {

            const isSelected =
              appointment.id === selectedAppointmentId;

            return (

              <button
                id={`appointment-${appointment.id}`}
                key={appointment.id}
                type="button"
                onClick={() =>
                  handleSelectAppointment(
                    appointment.id,
                  )
                }
                className={`min-w-28 shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
                }`}
              >

                <span className="block text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
                  {getAppointmentDateLabel(
                    appointment.date,
                  )}
                </span>

                {appointment.time && (
                  <span className="mt-0.5 block text-sm font-semibold">
                    {appointment.time}
                  </span>
                )}

                {(getAppointmentSubject(
                  appointment,
                ) || appointment.client) && (
                  <span className="mt-0.5 block truncate text-xs font-medium sm:text-sm">
                    {getAppointmentSubject(
                      appointment,
                    ) || appointment.client}
                  </span>
                )}

                <span
                  className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${getAppointmentStatusClasses(
                    appointment.status,
                    isSelected,
                  )}`}
                >
                  {getAppointmentStatusLabel(
                    appointment.status,
                  )}
                </span>

              </button>

            );
          })}

        </div>

      </section>

    )}



  {homeState === "intervention" && (

      <section className="mb-3 min-w-0 shrink-0 text-center">
        <button
          type="button"
          aria-expanded={showUpcomingCalendar}
          onClick={() => {
            if (showUpcomingCalendar) {
              handleCloseUpcomingCalendar();
              return;
            }

            setCalendarFocusDate(
              upcomingAppointmentsList[0]?.date ?? todayDateKey,
            );
            setShowUpcomingCalendar(true);
          }}
          className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition sm:text-base ${
            showUpcomingCalendar
              ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:border-blue-700"
          }`}
        >
          Prochainement ({upcomingAppointmentsList.length})
        </button>
      </section>

    )}

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
      onSelectAppointment={handleSelectAppointment}
      onInterventionCreated={handlePlanningInterventionCreated}
    />
  )}


  {showAddClientModal && currentAppointment && (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <section className="max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          Informations client
        </h2>

        <div className="mt-5 space-y-4">
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
                  required
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

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Motif de l&apos;intervention
            <input
              required
              value={startInterventionTitle}
              onChange={(event) =>
                setStartInterventionTitle(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal dark:border-slate-700 dark:bg-slate-800"
            />
          </label>

          {startClientError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {startClientError}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 min-[360px]:grid-cols-2">
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
            {isAddingStartClient ? "Démarrage…" : "Ajouter et commencer"}
          </button>
        </div>
      </section>
    </div>
  )}


  {actionMode && currentAppointment && (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <section className="max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          Modifier l’intervention
        </h2>

        <div className="mt-5 space-y-4">
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

          {actionError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          )}
        </div>

        <div className="mt-6 grid gap-3 min-[360px]:grid-cols-2">
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

    hideMainContent={showUpcomingCalendar}

    currentAppointment={
      currentAppointment
    }

    report={report}

    error={reportError}

    isValidatingReport={isValidatingReport}

    savedClientName={
      savedClientName
    }


    onStartIntervention={
      handleStartIntervention
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

      <div className="max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:p-6">

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Prolonger l'intervention
        </h2>

        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Choisis la nouvelle date de fin de l'intervention.
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
