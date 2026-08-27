import {
  CalendarDays,
  Clock3,
  MapPin,
} from "lucide-react";

import {
  getAppointmentDateLabel,
  getAppointmentDisplayTitle,
  type Appointment,
} from "@/data/appointments";

type CurrentInterventionCardProps = {
  appointment: Appointment;
  isInProgress: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  forgeBar?: React.ReactNode;
};



export default function CurrentInterventionCard({
  appointment,
  isInProgress,
  onStart,
  onEdit,
  onDelete,
  forgeBar,
}: CurrentInterventionCardProps) {
  const displayTitle =
    getAppointmentDisplayTitle(
      appointment,
    );

  return (
    <article className="w-full overflow-hidden rounded-[2.25rem] border border-white/85 bg-white/80 shadow-[0_32px_100px_-44px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/45">
      <div className="p-6 text-center sm:p-9">


      {isInProgress && (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
          </span>
          Intervention en cours
        </div>
      )}



      <h2 className="text-balance text-center text-3xl font-bold tracking-[-0.045em] text-slate-950 dark:text-white sm:text-[2.65rem] sm:leading-tight">
        {appointment.client ||
          displayTitle}
      </h2>



      {appointment.client && (
        <p className="mx-auto mt-3 max-w-xl text-center text-base font-semibold leading-7 text-blue-700 dark:text-blue-400 sm:text-lg">
          {displayTitle}
        </p>
      )}

      <div className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
        {appointment.date && (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/75 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/70">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="capitalize">
              {getAppointmentDateLabel(appointment.date)}
            </span>
          </span>
        )}

        {appointment.time && (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/75 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/70">
            <Clock3 size={16} className="text-blue-600 dark:text-blue-400" />
            {appointment.time}
          </span>
        )}

        {appointment.address && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/75 px-4 py-2 dark:border-slate-700 dark:bg-slate-800/70">
            <MapPin size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate">{appointment.address}</span>
          </span>
        )}
      </div>



      {isInProgress && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-slate-200/70 bg-slate-50/60 px-5 py-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">


          <p className="dark:text-slate-300">
            Cette intervention est actuellement ouverte.
          </p>


          <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">
            Tu peux reprendre ici ↓
          </p>


        </div>
      )}




      <button
        type="button"
        onClick={onStart}
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
      >
        {isInProgress
          ? "Continuer l'intervention"
          : "Commencer l'intervention"}
      </button>

      <div className="mx-auto mt-3 grid max-w-sm grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          Supprimer
        </button>
      </div>
      </div>

      {forgeBar && (
        <div className="border-t border-slate-200/70 bg-slate-50/45 px-5 py-3 dark:border-slate-700/80 dark:bg-slate-950/25 sm:px-7">
          {forgeBar}
        </div>
      )}
    </article>
  );
}
