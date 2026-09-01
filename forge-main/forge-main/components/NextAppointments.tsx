const appointments = [
  {
    id: 1,
    time: "11h00",
    client: "M. Leroy",
    job: "Entretien chaudière",
  },
  {
    id: 2,
    time: "14h30",
    client: "Société Dupont",
    job: "Dépannage fuite",
  },
];

export default function NextAppointments() {
  return (
    <section className="mt-10 w-full">
  
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <article
            key={appointment.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="min-w-16 text-lg font-bold text-blue-600">
              {appointment.time}
            </div>

            <div>
              <h3 className="font-semibold text-slate-950 dark:text-white">
                {appointment.client}
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {appointment.job}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
