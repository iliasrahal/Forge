import {
  getAppointmentSubject,
  type Appointment,
} from "@/data/appointments";
import { sortActiveTodayAppointments } from "@/src/lib/intervention-calendar";
import { formatParisDateKey } from "@/src/lib/paris-datetime";

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
  const todayKey = formatParisDateKey(new Date());

  if (visibleAppointments.length === 0) return null;

  return (
    <section className="mb-2 min-w-0 shrink-0 sm:mb-3" aria-labelledby="today-title">
      <h2
        id="today-title"
        className="mb-1.5 text-center text-[0.68rem] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300 sm:mb-2 sm:text-xs"
      >
        Aujourd&apos;hui
      </h2>

      <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
        {visibleAppointments.map((appointment) => {
          const selected = appointment.id === selectedAppointmentId;
          const inProgress = appointment.status === "inProgress";
          const finalizing = appointment.status === "completed" && Boolean(appointment.finalizationStep);
          const subject = getAppointmentSubject(appointment) || "Intervention";
          const todayTasks = appointment.dayTasks?.filter((task) => task.date === todayKey) ?? [];

          return (
            <button
              id={`appointment-${appointment.id}`}
              key={appointment.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(appointment.id)}
              className={`forge-surface flex min-h-[6.25rem] w-[10.5rem] min-w-[10.5rem] snap-start flex-col rounded-2xl border px-3 py-2.5 text-left transition sm:min-h-[8.5rem] sm:w-56 sm:min-w-0 sm:px-3.5 sm:py-3 ${
                selected
                  ? "border-blue-500 bg-blue-500/15 shadow-md shadow-blue-500/15 ring-1 ring-inset ring-blue-500/25"
                  : "hover:border-blue-300 hover:bg-blue-500/5 dark:hover:border-blue-700"
              }`}
            >
              <span className="text-sm font-bold text-slate-950 dark:text-white sm:text-base">
                  {appointment.time || "Aujourd’hui"}
              </span>
              <span className="mt-1 line-clamp-1 text-sm font-semibold leading-5 text-slate-800 dark:text-slate-100 sm:mt-2 sm:line-clamp-2">
                {subject}
              </span>
              {todayTasks.length > 0 && (
                <span className="mt-1 hidden line-clamp-2 text-xs font-medium text-blue-700 dark:text-blue-300 sm:block">
                  Aujourd’hui : {todayTasks.map((task) => `${task.startTime ? `${task.startTime} · ` : ""}${task.title}`).join(" · ")}
                </span>
              )}
              {appointment.client ? (
                <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                  {appointment.client}
                </span>
              ) : null}
              <span
                className={`mt-auto pt-1.5 text-[0.62rem] font-bold uppercase tracking-wide sm:pt-3 sm:text-[0.65rem] ${
                  inProgress
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-blue-600 dark:text-blue-300"
                }`}
              >
                {inProgress ? "En cours" : finalizing ? "À finaliser" : "À faire"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
