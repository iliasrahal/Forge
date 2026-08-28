"use client";

import { useState } from "react";

export default function CancelSubscriptionControls() {
  const [cancelRequested, setCancelRequested] = useState(false);
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
      <p className="text-center text-sm text-red-600 dark:text-red-300">Tu peux arrêter ton abonnement Forge à tout moment.</p>
      {!cancelRequested ? (
        <button type="button" onClick={() => setCancelRequested(true)} className="mt-5 w-full rounded-2xl border border-red-300 px-5 py-4 font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900">Résilier mon abonnement</button>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">Confirme-tu vouloir résilier ton abonnement Forge ?</p>
          <button type="button" className="w-full rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white transition hover:bg-red-700">Confirmer la résiliation</button>
          <button type="button" onClick={() => setCancelRequested(false)} className="w-full rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Annuler</button>
        </div>
      )}
    </div>
  );
}
