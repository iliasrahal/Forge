"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";

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
  todayDateKey: string;
  focusDate?: string | null;
  onClose: () => void;
  onSelectAppointment: (appointmentId: string) => void;
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
  todayDateKey,
  focusDate,
  onClose,
  onSelectAppointment,
}: UpcomingCalendarProps) {
  const initialDateKey = focusDate || appointments[0]?.date || todayDateKey;
  const initialDate = parseDateKey(initialDateKey);
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: initialDate.getUTCFullYear(),
    month: initialDate.getUTCMonth(),
  }));
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);

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
        <h2 className="text-center text-lg font-bold capitalize text-blue-700 dark:text-blue-400 sm:text-xl">
          {selectedDateLabel}
        </h2>
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
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Aucune intervention prévue ce jour-là.
          </p>
        )}
      </div>
    </section>
  );
}
