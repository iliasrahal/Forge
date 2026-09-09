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
    <section className="mb-3 min-w-0 shrink-0" aria-labelledby="today-title">
      <h2
        id="today-title"
        className="mb-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"
      >
        Aujourd&apos;hui
      </h2>

      <div className="flex flex-wrap justify-center gap-2">
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
              className={`forge-surface flex min-h-[8.5rem] w-full min-w-0 flex-col rounded-2xl border px-3.5 py-3 text-left transition min-[360px]:w-[calc(50%-0.25rem)] sm:w-56 ${
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
              {todayTasks.length > 0 && (
                <span className="mt-1 line-clamp-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                  Aujourd’hui : {todayTasks.map((task) => `${task.startTime ? `${task.startTime} · ` : ""}${task.title}`).join(" · ")}
                </span>
              )}
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
                {inProgress ? "En cours" : finalizing ? "À finaliser" : "À faire"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
