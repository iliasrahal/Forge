import {
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";
import { sortActiveTodayAppointments } from "@/src/lib/intervention-calendar";

type TodayInterventionsProps = {
  appointments: Appointment[];
  selectedAppointmentId: string | null;
  onSelect: (appointmentId: string) => void;
};

export default function TodayInterventions({
  appointments,
  selectedAppointmentId,
  onSelect,
}: TodayInterventionsProps) {
  const visibleAppointments = sortActiveTodayAppointments(appointments);

  if (visibleAppointments.length === 0) return null;

  return (
    <section className="mb-3 min-w-0 shrink-0" aria-labelledby="today-title">
      <h2
        id="today-title"
        className="mb-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"
      >
        Aujourd&apos;hui
      </h2>

      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3">
        {visibleAppointments.map((appointment) => {
          const selected = appointment.id === selectedAppointmentId;
          const inProgress = appointment.status === "inProgress";
          const subject = getAppointmentSubject(appointment) || "Intervention";

          return (
            <button
              id={`appointment-${appointment.id}`}
              key={appointment.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(appointment.id)}
              className={`forge-surface flex min-h-[8.5rem] min-w-0 flex-col rounded-2xl border px-3.5 py-3 text-left transition ${
                selected
                  ? "border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/15 ring-1 ring-inset ring-blue-500/25"
                  : "hover:border-blue-300 hover:bg-blue-500/5 dark:hover:border-blue-700"
              }`}
            >
              <span className="text-base font-bold text-slate-950 dark:text-white">
                  {appointment.time || "Aujourd’hui"}
              </span>
              <span className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100">
                {subject}
              </span>
              {appointment.client ? (
                <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {appointment.client}
                </span>
              ) : null}
              <span
                className={`mt-auto pt-3 text-[0.65rem] font-bold uppercase tracking-wide ${
                  inProgress
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-blue-600 dark:text-blue-300"
                }`}
              >
                {inProgress ? "En cours" : "À faire"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
