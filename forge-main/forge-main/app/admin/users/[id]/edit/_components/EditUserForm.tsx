"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateUser } from "@/app/admin/_actions";

type Initial = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
};

const FIELDS: { name: keyof Initial; label: string; type?: string }[] = [
  { name: "firstName", label: "Prénom" },
  { name: "lastName", label: "Nom" },
  { name: "companyName", label: "Société" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Téléphone" },
];

export default function EditUserForm({
  userId,
  initial,
}: {
  userId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateUser(userId, formData);
          if (result.ok) {
            router.push(`/admin/users/${userId}`);
          } else {
            setError(result.error);
          }
        });
      }}
      className="space-y-4"
    >
      {FIELDS.map((field) => (
        <label key={field.name} className="block text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {field.label}
          </span>
          <input
            name={field.name}
            type={field.type ?? "text"}
            defaultValue={initial[field.name]}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
      ))}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
