type Appointment = {
  client: string;
  address: string;
  time: string;
  intervention: string;
};



type CurrentInterventionCardProps = {
  appointment: Appointment;
  isInProgress: boolean;
  onStart: () => void;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
};



export default function CurrentInterventionCard({
  appointment,
  isInProgress,
  onStart,
  onEdit,
  onReschedule,
  onDelete,
}: CurrentInterventionCardProps) {
  return (
    <div className="w-full rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">


      {isInProgress && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
          Intervention en cours
        </div>
      )}



      <h2 className="text-center text-4xl font-bold text-blue-700 dark:text-blue-400">
        {appointment.client}
      </h2>



      <p className="mt-4 text-center text-xl font-medium text-slate-700 dark:text-slate-300">
        {appointment.intervention}
      </p>



      {isInProgress && (
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">


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
        className="mt-5 w-full rounded-2xl bg-blue-600 px-6 py-4 text-xl font-semibold text-white transition hover:bg-blue-700"
      >
        {isInProgress
          ? "Continuer l'intervention"
          : "Commencer l'intervention"}
      </button>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={onReschedule}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200"
        >
          Décaler
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
