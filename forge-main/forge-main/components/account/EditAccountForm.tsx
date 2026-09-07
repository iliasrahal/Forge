"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type EditableUserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
};

export default function EditAccountForm({ initialProfile }: { initialProfile: EditableUserProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof EditableUserProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await response.json()) as { error?: string; user?: EditableUserProfile };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Impossible d’enregistrer les informations.");
      }

      localStorage.setItem("forgeUserFirstName", data.user.firstName);
      localStorage.setItem("forgeUserProfile", JSON.stringify(data.user));
      router.push("/settings/account");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Impossible d’enregistrer les informations.");
      setSaving(false);
    }
  }

  const fields: Array<{ name: keyof EditableUserProfile; label: string; type: string; autoComplete: string }> = [
    { name: "firstName", label: "Prénom", type: "text", autoComplete: "given-name" },
    { name: "lastName", label: "Nom", type: "text", autoComplete: "family-name" },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "phone", label: "Téléphone", type: "tel", autoComplete: "tel" },
    { name: "companyName", label: "Entreprise", type: "text", autoComplete: "organization" },
  ];

  return (
    <>
      <div className="mt-8 space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-2 block text-sm font-semibold text-blue-700 dark:text-blue-400">
              {field.label}
            </label>
            <input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required={["firstName", "lastName", "email", "phone"].includes(field.name)}
              value={profile[field.name]}
              onChange={(event) => updateField(field.name, event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        ))}
      </div>

      {error ? <p className="mt-5 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">{error}</p> : null}

      <button type="button" onClick={() => void saveProfile()} disabled={saving} className="mt-8 w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </>
  );
}
