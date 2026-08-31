"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import {
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";
import {
  getCalendarDays,
  groupAppointmentsByDate,
  parseDateKey,
} from "@/src/lib/intervention-calendar";

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
};

export type PlanningClient = {
  id: string;
  name: string;
};

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getStatusLabel(status: Appointment["status"]) {
  if (status === "inProgress") return "En cours";
  if (status === "completed") return "Terminée";
  if (status === "postponed") return "Reportée";
  if (status === "cancelled") return "Annulée";
  return "Planifiée";
}

export default function UpcomingCalendar({
  appointments,
  clients,
  todayDateKey,
  focusDate,
  onClose,
  onSelectAppointment,
  onInterventionCreated,
}: UpcomingCalendarProps) {
  const initialDateKey = focusDate || appointments[0]?.date || todayDateKey;
  const initialDate = parseDateKey(initialDateKey);
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: initialDate.getUTCFullYear(),
    month: initialDate.getUTCMonth(),
  }));
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const [showCreationForm, setShowCreationForm] = useState(false);
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    clients.length > 0 ? "existing" : "new",
  );
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState(initialDateKey);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [description, setDescription] = useState("");
  const [creationError, setCreationError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const appointmentsByDate = useMemo(
    () => groupAppointmentsByDate(appointments),
    [appointments],
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

  const openCreationForm = () => {
    setScheduledDate(selectedDateKey);
    setCreationError("");
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
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.intervention?.id) {
        throw new Error(data.error || "Impossible de créer l’intervention.");
      }

      setShowCreationForm(false);
      setTitle("");
      setDescription("");
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

  return (
    <section className="min-h-0 flex-1 overflow-y-auto pb-44 sm:pb-48" aria-label="Planning des interventions">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-3 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.42)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
              Planning
            </p>
            <h1 className="mt-1 text-xl font-bold capitalize sm:text-2xl">{monthLabel}</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le planning"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600 dark:hover:text-blue-300"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mois précédent"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600"
          >
            <ChevronLeft size={19} />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="justify-self-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Mois suivant"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-600"
          >
            <ChevronRight size={19} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold text-slate-500 dark:text-slate-400 sm:gap-2 sm:text-xs">
          {weekDays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((day) => {
            const count = appointmentsByDate.get(day.dateKey)?.length ?? 0;
            const isSelected = day.dateKey === selectedDateKey;
            const isToday = day.dateKey === todayDateKey;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => selectDate(day.dateKey)}
                aria-pressed={isSelected}
                aria-label={`${day.day}${count ? `, ${count} intervention${count > 1 ? "s" : ""}` : ""}`}
                className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl border text-sm transition sm:min-h-12 ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 font-bold text-white shadow-md shadow-blue-600/20"
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
          <button
            type="button"
            onClick={openCreationForm}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700"
          >
            + Nouvelle intervention
          </button>
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
                <span className="w-12 shrink-0 pt-0.5 text-sm font-bold text-blue-700 dark:text-blue-400">
                  {appointment.time || "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-950 dark:text-white">
                    {appointment.client || "Client non renseigné"}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                    {getAppointmentSubject(appointment) || "Intervention"}
                  </span>
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[0.68rem] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {getStatusLabel(appointment.status)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Aucune intervention prévue ce jour-là.
          </p>
        )}
      </div>

      {showCreationForm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <form
            onSubmit={createIntervention}
            className="max-h-[calc(100dvh-1rem-env(safe-area-inset-bottom))] w-full max-w-md overflow-y-auto rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Planning</p>
                <h2 className="mt-1 text-xl font-bold">Nouvelle intervention</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreationForm(false)}
                aria-label="Fermer"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {clients.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setClientMode("existing")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${clientMode === "existing" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Client existant
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode("new")}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${clientMode === "new" ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}
                  >
                    Nouveau client
                  </button>
                </div>
              )}

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
              ) : (
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
              )}

              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Motif de l’intervention
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>

              <div className="grid gap-4 min-[360px]:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Date
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                    required
                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Heure
                  <input
                    type="time"
                    step={60}
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                    required
                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal text-slate-950 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

              {creationError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{creationError}</p>
              )}
            </div>

            <div className="mt-6 grid gap-3 min-[360px]:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowCreationForm(false)}
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
        </div>
      )}
    </section>
  );
}
