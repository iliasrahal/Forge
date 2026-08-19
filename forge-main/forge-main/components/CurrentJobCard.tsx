export default function CurrentJobCard() {
  return (
    <section className="mt-8 w-full rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60">

      <h2 className="text-center text-4xl font-bold">
        Mme Martin
      </h2>

      <p className="mt-5 text-center text-5xl font-bold text-blue-600">
        08h30
      </p>

      <p className="mt-6 text-center text-xl">
        Remplacement chauffe-eau
      </p>

      <button
        className="mt-10 w-full rounded-2xl bg-blue-600 py-5 text-2xl font-semibold text-white transition hover:bg-blue-700"
      >
        C'est parti
      </button>

    </section>
  );
}