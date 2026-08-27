const steps = [
  "Dictez ou saisissez",
  "Forge organise",
  "Vous gardez le contrôle",
];

export default function Workflow() {
  return (
    <section className="bg-white px-6 py-20 text-slate-950 sm:py-24 lg:px-8 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Un fonctionnement naturel</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-600 font-bold text-white">{index + 1}</span>
              <h3 className="mt-5 font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
