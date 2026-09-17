"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import {
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";
import {
  getCalendarDays,
  groupAppointmentsByDate,
  parseDateKey,
} from "@/src/lib/intervention-calendar";
import { isInterventionDatePast } from "@/src/lib/intervention-display-status";

type UpcomingCalendarProps = {
  appointments: Appointment[];
  clients: PlanningClient[];
  todayDateKey: string;
  focusDate?: string | null;
  onClose: () => void;
  onSelectAppointment: (appointmentId: string) => void;
  onInterventionCreated: (
    interventionId: string,
    scheduledDate: string,
  ) => void;
  canWrite: boolean;
  autoOpenCreationForm?: boolean;
  currentUserId: string;
  members: Array<{ id: string; name: string }>;
};

export type PlanningClient = {
  id: string;
  name: string;
};

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getStatusLabel(
  status: Appointment["status"],
  scheduledDateKey: string,
  todayDateKey: string,
) {
  if (status === "inProgress") return "En cours";
  if (status === "completed") return "Terminée";
  if (status === "postponed") return "Reportée";
  if (status === "cancelled") return "Annulée";
  if (isInterventionDatePast(scheduledDateKey, todayDateKey)) return "Passée";
  return "Planifiée";
}

function getStatusClasses(status: Appointment["status"], isPast: boolean) {
  if (status === "inProgress") return "bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300";
  if (status === "completed") return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300";
  if (status === "cancelled") return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (status === "postponed") return "bg-violet-50 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300";
  if (isPast) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
}

function getParticipantSummary(names: string[]) {
  const initials = names.slice(0, 3).map((name) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase("fr-FR"))
      .join(""),
  );
  return `${initials.join(" · ")}${names.length > 3 ? ` +${names.length - 3}` : ""}`;
}

export default function UpcomingCalendar({
  appointments,
  clients,
  todayDateKey,
  focusDate,
  onClose,
  onSelectAppointment,
  onInterventionCreated,
  canWrite,
  autoOpenCreationForm = false,
  currentUserId,
  members,
}: UpcomingCalendarProps) {
  const initialDateKey = focusDate || todayDateKey;
  const initialDate = parseDateKey(initialDateKey);
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: initialDate.getUTCFullYear(),
    month: initialDate.getUTCMonth(),
  }));
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [showCreationForm, setShowCreationForm] = useState(
    () => canWrite && autoOpenCreationForm,
  );
  const [clientMode, setClientMode] = useState<"none" | "existing" | "new">("none");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(initialDateKey);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [scheduledEndDate, setScheduledEndDate] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [memberFilter, setMemberFilter] = useState("all");
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!showCreationForm) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showCreationForm]);

  const filteredAppointments = useMemo(() => memberFilter === "all" ? appointments : appointments.filter((appointment) => appointment.assigneeIds?.includes(memberFilter)), [appointments, memberFilter]);
  const appointmentsByDate = useMemo(
    () => groupAppointmentsByDate(filteredAppointments),
    [filteredAppointments],
  );
  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth.year, visibleMonth.month),
    [visibleMonth],
  );
  const selectedAppointments = appointmentsByDate.get(selectedDateKey) ?? [];
  const selectedDate = parseDateKey(selectedDateKey);
  const monthLabel = new Date(
    Date.UTC(visibleMonth.year, visibleMonth.month, 1),
  ).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const selectedDateLabel = selectedDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.month + offset, 1),
    );
    setVisibleMonth({
      year: nextMonth.getUTCFullYear(),
      month: nextMonth.getUTCMonth(),
    });
    setSelectedDateKey(
      [
        nextMonth.getUTCFullYear(),
        String(nextMonth.getUTCMonth() + 1).padStart(2, "0"),
        "01",
      ].join("-"),
    );
  };

  const selectDate = (dateKey: string) => {
    const date = parseDateKey(dateKey);
    setSelectedDateKey(dateKey);
    setVisibleMonth({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
    });
  };

  const goToToday = () => selectDate(todayDateKey);

  // Quand le formulaire a été ouvert directement depuis l'accueil, le refermer
  // sans créer ramène à l'accueil plutôt que d'échouer dans le planning.
  const closeCreationForm = () => {
    setShowCreationForm(false);
    setShowOptionalFields(false);
    if (autoOpenCreationForm) {
      onClose();
    }
  };

  const openCreationForm = () => {
    setScheduledDate(selectedDateKey);
    setCreationError("");
    setShowOptionalFields(false);
    setShowCreationForm(true);
  };

  const createIntervention = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;

    if (clientMode === "existing" && !clientId) {
      setCreationError("Sélectionnez un client.");
      return;
    }

    if (clientMode === "new" && !newClientName.trim()) {
      setCreationError("Indiquez le nom du nouveau client.");
      return;
    }

    setIsCreating(true);
    setCreationError("");

    try {
      const response = await fetch("/api/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientMode === "existing" ? clientId : undefined,
          clientName: clientMode === "new" ? newClientName.trim() : undefined,
          title: title.trim(),
          description: description.trim(),
          scheduledDate,
          scheduledTime,
          scheduledEndDate: scheduledEndDate || null,
          scheduledEndTime: scheduledEndTime || null,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.intervention?.id) {
        throw new Error(data.error || "Impossible de créer l’intervention.");
      }

      setShowCreationForm(false);
      setTitle("");
      setDescription("");
      setShowOptionalFields(false);
      setScheduledEndDate("");
      setScheduledEndTime("");
      setNewClientName("");
      onInterventionCreated(data.intervention.id, scheduledDate);
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : "Impossible de créer l’intervention.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Ouvert depuis l'accueil : on n'affiche que la modale, pas tout le planning.
  const modalOnly = autoOpenCreationForm && showCreationForm;

  return (
    <section
      className={
        modalOnly ? "contents" : "min-h-0 flex-1 overflow-y-auto pb-44 sm:pb-48"
      }
      aria-label="Planning des interventions"
    >
      {!modalOnly ? (
      <>
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)] dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-[var(--forge-text-primary)] sm:text-xl">Calendrier</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le planning"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-300"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2 sm:mt-4">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mois précédent"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600"
          >
            <ChevronLeft size={19} />
          </button>
          <h2 className="text-center text-lg font-bold capitalize text-[var(--forge-text-primary)] sm:text-2xl">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mois suivant"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={goToToday}
            className="min-h-10 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Aujourd’hui
          </button>
        </div>

        {members.length > 0 ? <>
        <label className="mt-3 block sm:hidden">
          <span className="sr-only">Filtrer par collaborateur</span>
          <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <option value="all">Toutes les interventions</option>
            <option value={currentUserId}>Mes interventions</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <div className="mt-4 hidden max-w-full flex-wrap gap-2 sm:flex" aria-label="Filtrer par collaborateur">
          <button type="button" onClick={() => setMemberFilter("all")} aria-pressed={memberFilter === "all"} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${memberFilter === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>Toutes</button>
          <button type="button" onClick={() => setMemberFilter(currentUserId)} aria-pressed={memberFilter === currentUserId} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${memberFilter === currentUserId ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>Mes interventions</button>
          {members.map((member) => <button key={member.id} type="button" onClick={() => setMemberFilter(member.id)} aria-pressed={memberFilter === member.id} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${memberFilter === member.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>{member.name}</button>)}
        </div></> : null}

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold text-slate-500 dark:text-slate-400 sm:gap-2 sm:text-xs">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day) => {
            const count = appointmentsByDate.get(day.dateKey)?.length ?? 0;
            const isSelected = day.dateKey === selectedDateKey;
            const isToday = day.dateKey === todayDateKey;
            const hasMultiDay = (appointmentsByDate.get(day.dateKey) ?? []).some(
              (appointment) => appointment.endDate && appointment.endDate !== appointment.date,
            );

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => selectDate(day.dateKey)}
                aria-pressed={isSelected}
                aria-label={`${day.dateKey === todayDateKey ? "Aujourd’hui, " : ""}${day.day} ${monthLabel}${count ? `, ${count} intervention${count > 1 ? "s" : ""}` : ", aucune intervention"}${hasMultiDay ? ", chantier multi-jours" : ""}`}
                className={`relative flex aspect-square min-h-10 min-w-0 flex-col items-center justify-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:min-h-12 ${
                  isSelected
                    ? `border-blue-600 bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20 ${isToday ? "ring-2 ring-pink-300 ring-offset-1 dark:ring-pink-500" : ""}`
                    : isToday
                      ? "border-blue-300 bg-blue-50 font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      : day.isCurrentMonth
                        ? "border-transparent text-slate-800 hover:border-blue-200 hover:bg-blue-50 dark:text-slate-200 dark:hover:border-blue-900 dark:hover:bg-blue-950/60"
                        : "border-transparent text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800/60"
                }`}
              >
                <span>{day.day}</span>
                {count > 0 && (
                  <span className={`mt-0.5 flex min-h-3 items-center gap-0.5 text-[0.58rem] font-bold sm:text-[0.65rem] ${isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-600 dark:bg-blue-400"}`} />
                    {count}
                  </span>
                )}
                {hasMultiDay ? <span className={`absolute inset-x-2 bottom-1 h-0.5 rounded-full ${isSelected ? "bg-violet-200" : "bg-violet-500"}`} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
          <h2 className="text-center text-lg font-bold capitalize text-blue-700 dark:text-blue-400 sm:text-left sm:text-xl">
            {selectedDateLabel}
          </h2>
          {canWrite ? <button
            type="button"
            onClick={openCreationForm}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700"
          >
            + Nouvelle intervention
          </button> : null}
        </div>
        {selectedAppointments.length > 0 ? (
          <div className="mt-4 space-y-3">
            {selectedAppointments.map((appointment) => (
              <button
                id={`appointment-${appointment.id}`}
                key={appointment.id}
                type="button"
                onClick={() => onSelectAppointment(appointment.id)}
                className="flex w-full items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-blue-700"
              >
                {appointment.time ? <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-blue-700 dark:text-blue-400">{appointment.time}</span> : null}
                <span className="min-w-0 flex-1">
                  {appointment.client ? <span className="block truncate font-semibold text-slate-950 dark:text-white">{appointment.client}</span> : null}
                  {getAppointmentSubject(appointment) ? <span className={`${appointment.client ? "mt-1" : ""} block text-sm text-slate-600 dark:text-slate-300`}>{getAppointmentSubject(appointment)}</span> : null}
                  {appointment.assigneeNames?.length ? <span className="mt-1 block text-xs font-medium text-violet-700 dark:text-violet-300" aria-label={`Participants : ${appointment.assigneeNames.join(", ")}`}>{getParticipantSummary(appointment.assigneeNames)}</span> : null}
                  {(appointment.dayTasks?.filter((task) => task.date === selectedDateKey) ?? []).slice(0, 2).map((task) => (
                    <span key={task.id} className="mt-1 block text-xs font-medium text-blue-700 dark:text-blue-300">
                      {task.startTime ? `${task.startTime} · ` : ""}{task.title}
                    </span>
                  ))}
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${getStatusClasses(appointment.status, isInterventionDatePast(appointment.endDate || appointment.date, todayDateKey))}`}>
                    {getStatusLabel(
                      appointment.status,
                      appointment.endDate || appointment.date,
                      todayDateKey,
                    )}
                  </span>
                  {appointment.endDate && appointment.endDate !== appointment.date ? (
                    <span className="ml-2 mt-2 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[0.68rem] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      Jusqu’au {new Date(`${appointment.endDate}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-7 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune intervention prévue.</p>
            {canWrite ? <button type="button" onClick={openCreationForm} className="mt-3 min-h-10 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300">+ Nouvelle intervention</button> : null}
          </div>
        )}
      </div>
      </>
      ) : null}

      {canWrite && showCreationForm && isMounted ? createPortal(
        <div className="forge-modal-overlay forge-viewport-dialog fixed inset-0 z-[70] flex h-dvh items-center justify-center overflow-hidden p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4">
          <form
            onSubmit={createIntervention}
            className="flex max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
              <div>
                <h2 className="text-xl font-bold">Nouvelle intervention</h2>
              </div>
              <button
                type="button"
                onClick={closeCreationForm}
                aria-label="Fermer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-2 sm:space-y-4 sm:px-6 sm:py-3">
              <div className="grid min-w-0 gap-3 min-[360px]:grid-cols-2 sm:gap-4">
                <label className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Date
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                    required
                    className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:mt-2 sm:py-3"
                  />
                </label>
                <label className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Heure
                  <input
                    type="time"
                    step={60}
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                    required
                    className="mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:mt-2 sm:py-3"
                  />
                </label>
              </div>

              <button
                type="button"
                aria-expanded={showOptionalFields}
                onClick={() => setShowOptionalFields((current) => !current)}
                className="flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-200 px-3 text-sm font-semibold text-blue-700 dark:border-blue-800 dark:text-blue-300 sm:hidden"
              >
                {showOptionalFields ? "Masquer les informations facultatives" : "+ Ajouter des informations"}
              </button>

              <div className={`${showOptionalFields ? "space-y-3" : "hidden"} sm:block sm:space-y-4`}>
              <div className={`grid gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 ${clients.length > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
                  <button
                    type="button"
                    onClick={() => setClientMode("none")}
                    className={`rounded-xl px-2 py-2 text-sm font-semibold transition ${clientMode === "none" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Sans client
                  </button>
                {clients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setClientMode("existing")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${clientMode === "existing" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Client existant
                  </button>
                )}
                  <button
                    type="button"
                    onClick={() => setClientMode("new")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${clientMode === "new" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Nouveau client
                  </button>
              </div>

              {clientMode === "existing" && clients.length > 0 ? (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Client
                  <select
                    value={clientId}
                    onChange={(event) => setClientId(event.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </label>
              ) : clientMode === "new" ? (
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Nom du nouveau client
                  <input
                    value={newClientName}
                    onChange={(event) => setNewClientName(event.target.value)}
                    required
                    placeholder="Exemple : Paul Martin"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              ) : null}

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Motif de l’intervention <span className="font-normal text-slate-400">(facultatif)</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="grid min-w-0 gap-4 min-[360px]:grid-cols-2">
                <label className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Date de fin <span className="font-normal text-slate-400">(facultatif)</span>
                  <input
                    type="date"
                    min={scheduledDate}
                    value={scheduledEndDate}
                    onChange={(event) => setScheduledEndDate(event.target.value)}
                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block min-w-0 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Heure de fin <span className="font-normal text-slate-400">(facultatif)</span>
                  <input
                    type="time"
                    step={60}
                    value={scheduledEndTime}
                    onChange={(event) => setScheduledEndTime(event.target.value)}
                    disabled={!scheduledEndDate}
                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Description <span className="font-normal text-slate-400">(facultatif)</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              </div>

              {creationError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{creationError}</p>
              )}
            </div>

            <div className="relative z-10 grid shrink-0 gap-2 border-t border-slate-200/80 bg-white/95 px-4 pb-4 pt-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 min-[360px]:grid-cols-2 sm:gap-3 sm:px-6 sm:pb-6 sm:pt-4">
              <button
                type="button"
                onClick={closeCreationForm}
                disabled={isCreating}
                className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {isCreating ? "Création…" : "Créer l’intervention"}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
