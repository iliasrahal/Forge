import {
  getAppointmentDisplayTitle,
  type Appointment,
} from "@/data/appointments";

type CurrentInterventionCardProps = {
  appointment: Appointment;
  isInProgress: boolean;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
};



export default function CurrentInterventionCard({
  appointment,
  isInProgress,
  onStart,
  onEdit,
  onDelete,
}: CurrentInterventionCardProps) {
  const displayTitle =
    getAppointmentDisplayTitle(
      appointment,
    );

  return (
    <div className="w-full rounded-[2rem] border border-white/80 bg-white/80 p-6 text-center shadow-[0_28px_80px_-38px_rgba(15,23,42,0.48)] backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/40 sm:p-8">


      {isInProgress && (
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          Intervention en cours
        </div>
      )}



      <h2 className="text-balance text-center text-3xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">
        {appointment.client ||
          displayTitle}
      </h2>



      {appointment.client && (
        <p className="mt-3 text-center text-lg font-semibold text-blue-700 dark:text-blue-400 sm:text-xl">
          {displayTitle}
        </p>
      )}



      {isInProgress && (
        <div className="mt-6 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-5 py-4 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">


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
        className="mt-6 w-full rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:text-xl"
      >
        {isInProgress
          ? "Continuer l'intervention"
          : "Commencer l'intervention"}
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2">
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
  );
}
