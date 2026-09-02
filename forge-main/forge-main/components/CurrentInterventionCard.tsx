import Link from "next/link";

import {
  getAppointmentDateLabel,
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";

type CurrentInterventionCardProps = {
  appointment: Appointment;
  isInProgress: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canWrite: boolean;
};



export default function CurrentInterventionCard({
  appointment,
  isInProgress,
  onStart,
  onEdit,
  onDelete,
  canWrite,
}: CurrentInterventionCardProps) {
  const subject =
    getAppointmentSubject(appointment);
  const mainTitle =
    appointment.client || subject;

  return (
    <article className="forge-surface w-full overflow-hidden rounded-[2.25rem] border border-t-2">
      <div className="px-4 pb-4 pt-5 text-center sm:px-8 sm:pb-5 sm:pt-7">


      <div
        className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] shadow-sm ${
          isInProgress
            ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300"
            : "border-blue-200/80 bg-blue-50/80 text-blue-700 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300"
        }`}
      >
        {isInProgress ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
        )}
        {isInProgress
          ? "Intervention en cours"
          : "Intervention planifiée"}
      </div>



      {mainTitle && (
        <h2 className="text-balance text-center text-2xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
          {mainTitle}
        </h2>
      )}



      {appointment.client && subject && (
        <p className="mx-auto mt-2 max-w-xl text-center text-base font-semibold leading-6 text-blue-700 dark:text-blue-400 sm:text-lg">
          {subject}
        </p>
      )}

      <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
        {appointment.date && (
          <span className="forge-surface-subtle inline-flex items-center rounded-full border px-3.5 py-1.5">
            <span className="capitalize">
              {getAppointmentDateLabel(appointment.date)}
            </span>
          </span>
        )}

        {appointment.time && (
          <span className="forge-surface-subtle inline-flex items-center rounded-full border px-3.5 py-1.5">
            {appointment.time}
          </span>
        )}

        {appointment.endDate && (
          <span className="forge-surface-subtle inline-flex items-center rounded-full border px-3.5 py-1.5">
            Jusqu’au&nbsp;
            <span className="capitalize">
              {getAppointmentDateLabel(appointment.endDate)}
            </span>
            {appointment.endTime ? ` à ${appointment.endTime}` : ""}
          </span>
        )}

      </div>

      {canWrite ? (<button
        type="button"
        onClick={onStart}
        className="mt-4 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 sm:w-auto sm:px-6 sm:text-base"
      >
        {isInProgress
          ? "Continuer l'intervention"
          : "Commencer l'intervention"}
      </button>) : null}

      {canWrite ? (<div className="mx-auto mt-2.5 grid max-w-xs grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 sm:text-sm"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 sm:text-sm"
        >
          Supprimer
        </button>
      </div>) : (
        <Link
          href={`/interventions/${appointment.id}`}
          className="mx-auto mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-blue-200 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          Consulter l’intervention
        </Link>
      )}
      </div>

    </article>
  );
}
