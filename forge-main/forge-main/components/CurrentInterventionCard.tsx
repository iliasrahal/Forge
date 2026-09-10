import Link from "next/link";
import { buildInterventionHref } from "@/src/lib/intervention-navigation";

import {
  getAppointmentDateLabel,
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";

type CurrentInterventionCardProps = {
  appointment: Appointment;
  isInProgress: boolean;
  isFinalizing: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canWrite: boolean;
};



export default function CurrentInterventionCard({
  appointment,
  isInProgress,
  isFinalizing,
  onStart,
  onEdit,
  onDelete,
  canWrite,
}: CurrentInterventionCardProps) {
  const subject =
    getAppointmentSubject(appointment);
  const mainTitle =
    appointment.client || subject;
  const isMultiDay = Boolean(
    appointment.endDate && appointment.endDate !== appointment.date,
  );

  return (
    <article className="forge-surface w-full overflow-hidden rounded-[2.25rem] border">
      <div className="px-3.5 pb-3 pt-3.5 text-center sm:px-8 sm:pb-5 sm:pt-7">


      <div
        className={`mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] shadow-sm sm:mb-4 sm:px-3.5 sm:py-1.5 sm:text-[0.7rem] ${
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
          : isFinalizing
            ? "Intervention terminée"
          : "Intervention planifiée"}
      </div>



      {mainTitle && (
        <h2 className="text-balance text-center text-xl font-bold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl">
          {mainTitle}
        </h2>
      )}



      {appointment.client && subject && (
        <p className="mx-auto mt-1 max-w-xl text-center text-sm font-semibold leading-5 text-blue-700 dark:text-blue-400 sm:mt-2 sm:text-lg sm:leading-6">
          {subject}
        </p>
      )}

      <div className="mx-auto mt-2 flex max-w-xl flex-wrap items-center justify-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 sm:mt-4 sm:gap-2 sm:text-sm">
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
          className="mt-2.5 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 sm:mt-4 sm:w-auto sm:px-6 sm:py-2.5 sm:text-base"
      >
        {isInProgress
          ? "Continuer l'intervention"
          : isFinalizing
            ? "Reprendre la finalisation"
          : "Commencer l'intervention"}
      </button>) : null}

      {isMultiDay ? (
        <Link
          href={buildInterventionHref(appointment.id, "home")}
          className="mx-auto mt-1.5 inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-2xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/60 sm:mt-2.5 sm:w-auto sm:px-6 sm:py-2.5"
        >
          {canWrite ? "Gérer le chantier" : "Voir le chantier"}
        </Link>
      ) : null}

      {canWrite ? (<div className="mx-auto mt-1.5 grid max-w-xs grid-cols-2 gap-2 sm:mt-2.5">
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
      </div>) : !isMultiDay ? (
        <Link
          href={buildInterventionHref(appointment.id, "home")}
          className="mx-auto mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-blue-200 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          Consulter l’intervention
        </Link>
      ) : null}
      </div>

    </article>
  );
}
