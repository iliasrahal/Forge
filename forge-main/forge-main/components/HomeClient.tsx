"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import HomeContent from "@/components/HomeContent";
import type { Appointment } from "@/data/appointments";

type HomeState =
  | "finished"
  | "intervention"
  | "inProgress"
  | "reportInput"
  | "processing"
  | "review"
  | "saved"
  | "clientChoice"
  | "quoteChoice";

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

type QuoteDraft = {
  title: string;
  description: string;
};

type CompleteInterventionResponse = {
  clientId?: string;
  clientName?: string;
  quoteDraft?: QuoteDraft;
  error?: string;
};

type HomeClientProps = {
  todayAppointments: Appointment[];
  upcomingAppointments: Appointment[];
};

export default function HomeClient({
  todayAppointments,
  upcomingAppointments,
}: HomeClientProps) {
  const router = useRouter();

  const appointmentsContainerRef =
    useRef<HTMLDivElement | null>(null);

  const [homeState, setHomeState] =
    useState<HomeState>("intervention");

const [appointmentsList, setAppointmentsList] =
  useState<Appointment[]>(todayAppointments ?? []);

const [
  selectedAppointmentId,
  setSelectedAppointmentId,
] = useState<string | null>(
  todayAppointments?.[0]?.id ??
  upcomingAppointments?.[0]?.id ??
  null
);

  const [
    pendingInterventionId,
    setPendingInterventionId,
  ] = useState<string | null>(null);

  const [showGreeting, setShowGreeting] =
    useState(false);
const [showUpcoming, setShowUpcoming] =
  useState(false);
  const [
    isInitialWelcomeActive,
    setIsInitialWelcomeActive,
  ] = useState(false);

  const [report, setReport] =
    useState<InterventionReport | null>(null);

  const [reportError, setReportError] =
    useState("");

  const [savedClientName, setSavedClientName] =
    useState("");

  const [savedClientId, setSavedClientId] =
    useState<string | null>(null);

  const [quoteDraft, setQuoteDraft] =
    useState<QuoteDraft | null>(null);

  const [nextAppointmentId, setNextAppointmentId] =
    useState<string | null>(null);

  const currentAppointment = appointmentsList.find(
    (appointment) =>
      appointment.id === selectedAppointmentId,
  );

  useEffect(() => {
   setAppointmentsList(todayAppointments);

    setSelectedAppointmentId((currentId) => {
      if (isInitialWelcomeActive) {
        return null;
      }

      const currentAppointmentStillExists =
        todayAppointments.some(
          (appointment) =>
            appointment.id === currentId,
        );

      if (currentAppointmentStillExists) {
        return currentId;
      }

      return todayAppointments[0]?.id ?? null;
    });
  }, [
    todayAppointments,
    isInitialWelcomeActive,
  ]);

  useEffect(() => {
    if (!pendingInterventionId) {
      return;
    }

    const newInterventionExists =
      todayAppointments.some(
        (appointment) =>
          appointment.id === pendingInterventionId,
      );

    if (!newInterventionExists) {
      return;
    }

    setSelectedAppointmentId(
      pendingInterventionId,
    );

    setReport(null);
    setReportError("");
    setHomeState("intervention");

    const interventionId =
      pendingInterventionId;

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

      setPendingInterventionId(null);
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    todayAppointments,
    pendingInterventionId,
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

  const getAppointmentDateLabel = (
    appointmentDate: string,
  ) => {
    const today = new Date();
    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const appointmentDay = new Date(
      `${appointmentDate}T00:00:00`,
    );

    const formatDateKey = (date: Date) => {
      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1,
      ).padStart(2, "0");

      const day = String(
        date.getDate(),
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const todayKey = formatDateKey(today);
    const tomorrowKey =
      formatDateKey(tomorrow);

    if (appointmentDate === todayKey) {
      return "Aujourd’hui";
    }

    if (appointmentDate === tomorrowKey) {
      return "Demain";
    }

    return appointmentDay.toLocaleDateString(
      "fr-FR",
      {
        weekday: "short",
        day: "2-digit",
        month: "short",
      },
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

 const handleStartIntervention = async () => {
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

  setHomeState("reportInput");

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


    setHomeState("inProgress");


    router.refresh();


  } catch (error) {

    setReportError(
      error instanceof Error
        ? error.message
        : "Une erreur est survenue.",
    );

  }
};

  const handleFinishIntervention = () => {
    setReport(null);
    setReportError("");
    setHomeState("reportInput");
  };

  const handleSelectAppointment = (
    appointmentId: string,
  ) => {
    setIsInitialWelcomeActive(false);
    setSelectedAppointmentId(appointmentId);
    setReport(null);
    setReportError("");
    setHomeState("intervention");
  };

  const handleInterventionCreated = (
    interventionId: string,
  ) => {
    setIsInitialWelcomeActive(false);
    setPendingInterventionId(
      interventionId,
    );
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

    setHomeState(
      currentAppointment?.status ===
        "inProgress"
        ? "inProgress"
        : "intervention",
    );
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

        setQuoteDraft(
          data.quoteDraft ?? {
            title:
              currentAppointment.intervention,
            description: [
              report.intervention,
              report.travaux,
              report.recommandation,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        );

        setNextAppointmentId(
          nextAppointment?.id ?? null,
        );

        setReport(null);
        setReportError("");
        setHomeState("clientChoice");
        router.refresh();
      } catch (error) {
        setReportError(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue.",
        );

        setHomeState("review");
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


    setHomeState("quoteChoice");


  } catch (error) {

    console.error(
      "Erreur conservation client :",
      error,
    );

  }

};


const handleDeleteTemporaryClient = async () => {
  if (!currentAppointment) {
    return;
  }


  try {
    const response = await fetch(
      "/api/clients",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName:
            currentAppointment.client,
        }),
      },
    );


   if (!response.ok) {
  const error = await response.json();

  console.error(
    "Erreur API suppression client :",
    error,
  );

  throw new Error(
    error.error ??
      "Impossible de supprimer la fiche client.",
  );
}


    setHomeState("quoteChoice");


  } catch (error) {
    console.error(
      "Erreur suppression client temporaire :",
      error,
    );
  }
};



const handleSkipQuote = () => {
  setQuoteDraft(null);
  setSavedClientId(null);

  setHomeState("intervention");

  router.refresh();
};



const handleCreateQuote = () => {
  if (!savedClientId) {
    setReportError(
      "Forge ne retrouve pas le client concerné.",
    );
    return;
  }


  const params = new URLSearchParams();


  if (quoteDraft?.title) {
    params.set(
      "title",
      quoteDraft.title,
    );
  }


  if (quoteDraft?.description) {
    params.set(
      "description",
      quoteDraft.description,
    );
  }

    const queryString = params.toString();

    router.push(
      queryString
        ? `/clients/${savedClientId}/quotes/new?${queryString}`
        : `/clients/${savedClientId}/quotes/new`,
    );
  };

  return (
    <main
      className={`h-[calc(100dvh-7rem)] overflow-hidden bg-white px-6 text-slate-950 dark:bg-slate-950 dark:text-white ${
        showGreeting ? "pt-12" : "pt-6"
      }`}
    >
      <div className="mx-auto flex h-full w-full max-w-xl flex-col">
        <div className="mb-4 flex justify-end">
          <UserMenu />
        </div>

        {homeState === "intervention" &&
          appointmentsList.length > 0 && (
            <section className="mb-4 min-w-0 shrink-0">
              <div
                ref={appointmentsContainerRef}
                className="flex w-full gap-3 overflow-x-auto pb-2"
              >
                {appointmentsList.map(
                  (appointment) => {
                    const isSelected =
                      appointment.id ===
                      selectedAppointmentId;

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
                        className={`min-w-32 shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
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

                        <span className="mt-1 block text-sm font-semibold">
                          {appointment.time}
                        </span>

                        <span className="mt-1 block truncate text-sm font-medium">
                          {appointment.client}
                        </span>

                        <span
                          className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getAppointmentStatusClasses(
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
                  },
                )}
              </div>
            </section>
          )}
{homeState === "intervention" &&
  upcomingAppointments.length > 0 && (
    <section className="mb-4 shrink-0">
   <button
  type="button"
  onClick={() =>
    setShowUpcoming((previous) => !previous)
  }
  className="mb-3 flex w-full items-center justify-center text-lg font-semibold text-blue-700"
>
  <span>
    Prochainement ({upcomingAppointments.length})
  </span>

  <span className="ml-3 text-sm text-blue-500 dark:text-blue-400">
    {showUpcoming ? "▲" : "▼"}
  </span>
</button>

{showUpcoming && (
  <div className="flex gap-3 overflow-x-auto pb-2">
    {upcomingAppointments.map(
      (appointment) => (
        <button
          key={appointment.id}
          type="button"
          onClick={() =>
            handleSelectAppointment(
              appointment.id,
            )
          }
          className="min-w-40 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
        >
         <span className="block text-xs font-medium capitalize text-slate-500 dark:text-slate-400">
  {getAppointmentDateLabel(
    appointment.date,
  )}
</span>

          <span className="mt-1 block text-sm font-semibold">
            {appointment.time}
          </span>

          <span className="mt-1 block truncate text-sm font-medium">
            {appointment.client}
          </span>

          <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            À venir
          </span>
        </button>
      ),
    )}
  </div>
)}

    </section>
  )}
  <HomeContent
  state={homeState}
  currentAppointment={
    currentAppointment
  }
  report={report}
  error={reportError}
  savedClientName={
    savedClientName
  }
  onStartIntervention={
    handleStartIntervention
  }
  onFinishIntervention={
    handleFinishIntervention
  }
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
  onKeepClient={
    handleKeepClient
  }
  onDeleteTemporaryClient={
    handleDeleteTemporaryClient
  }
  onSkipQuote={
    handleSkipQuote
  }
  onCreateQuote={
    handleCreateQuote
  }
/>
</div>
</main>
);
}