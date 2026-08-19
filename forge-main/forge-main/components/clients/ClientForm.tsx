"use client";

import { useState } from "react";

type ClientType = "PARTICULIER" | "PROFESSIONNEL";

type ClientFormValues = {
  type?: ClientType;
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  phone?: string;
  email?: string | null;
  street?: string;
  postalCode?: string;
  city?: string;
};

type ClientFormProps = {
  onSubmit: (formData: FormData) => Promise<void>;
  initialValues?: ClientFormValues;
  submitLabel?: string;
};

const inputClassName =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500";


export default function ClientForm({
  onSubmit,
  initialValues,
  submitLabel = "Ajouter le client",
}: ClientFormProps) {


  const nameParts =
    initialValues?.name?.trim().split(" ") ?? [];


  const initialFirstName =
    initialValues?.firstName ??
    nameParts.slice(0, -1).join(" ");


  const initialLastName =
    initialValues?.lastName ??
    nameParts[nameParts.length - 1] ??
    "";



  const [clientType, setClientType] =
    useState(
      initialValues?.type ?? "PARTICULIER",
    );


  const isParticulier =
    clientType === "PARTICULIER";



  return (

    <form
      action={onSubmit}
      className="space-y-5"
    >


      <input
        type="hidden"
        name="type"
        value={clientType}
      />



      <div>

        <p className="mb-3 font-medium text-slate-700">
          Type de client
        </p>


        <div className="grid grid-cols-2 gap-3">


          <button
            type="button"
            onClick={() =>
              setClientType("PARTICULIER")
            }
            className={`rounded-2xl border px-4 py-4 font-semibold transition ${
              isParticulier
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
            }`}
          >
            Particulier
          </button>



          <button
            type="button"
            onClick={() =>
              setClientType("PROFESSIONNEL")
            }
            className={`rounded-2xl border px-4 py-4 font-semibold transition ${
              !isParticulier
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
            }`}
          >
            Professionnel
          </button>


        </div>

      </div>





      {isParticulier ? (

        <div className="grid gap-5 sm:grid-cols-2">


          <div>

            <label
              htmlFor="firstName"
              className="mb-2 block font-medium text-slate-700"
            >
              Prénom
            </label>


            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              defaultValue={initialFirstName}
              className={inputClassName}
            />


          </div>



          <div>

            <label
              htmlFor="lastName"
              className="mb-2 block font-medium text-slate-700"
            >
              Nom
            </label>


            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              defaultValue={initialLastName}
              className={inputClassName}
            />


          </div>


        </div>


      ) : (


        <div>

          <label
            htmlFor="companyName"
            className="mb-2 block font-medium text-slate-700"
          >
            Nom de l’entreprise
          </label>


          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            defaultValue={
              initialValues?.companyName ?? ""
            }
            className={inputClassName}
          />


        </div>


      )}






      <div>

        <label
          htmlFor="phone"
          className="mb-2 block font-medium text-slate-700"
        >
          Téléphone
        </label>


        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={
            initialValues?.phone ?? ""
          }
          placeholder=""
          className={inputClassName}
        />


      </div>






      <div>

        <label
          htmlFor="email"
          className="mb-2 block font-medium text-slate-700"
        >
          E-mail
        </label>


        <input
          id="email"
          name="email"
          type="email"
          defaultValue={
            initialValues?.email ?? ""
          }
          className={inputClassName}
        />


      </div>






      <div>

        <label
          htmlFor="street"
          className="mb-2 block font-medium text-slate-700"
        >
          Adresse
        </label>


        <input
          id="street"
          name="street"
          type="text"
          defaultValue={
            initialValues?.street ?? ""
          }
          className={inputClassName}
        />


      </div>






      <div className="grid gap-5 sm:grid-cols-2">


        <div>

          <label
            htmlFor="postalCode"
            className="mb-2 block font-medium text-slate-700"
          >
            Code postal
          </label>


          <input
            id="postalCode"
            name="postalCode"
            type="text"
            defaultValue={
              initialValues?.postalCode ?? ""
            }
            className={inputClassName}
          />


        </div>




        <div>

          <label
            htmlFor="city"
            className="mb-2 block font-medium text-slate-700"
          >
            Ville
          </label>


          <input
            id="city"
            name="city"
            type="text"
            defaultValue={
              initialValues?.city ?? ""
            }
            className={inputClassName}
          />


        </div>


      </div>






      <button
        type="submit"
        className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        {submitLabel}
      </button>



    </form>

  );

}