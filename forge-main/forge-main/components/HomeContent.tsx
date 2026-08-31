"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import CurrentInterventionCard from "@/components/CurrentInterventionCard";
import FixedForgeBar from "@/components/FixedForgeBar";
import ForgeListenCard from "@/components/ForgeListenCard";
import ForgeProcessingCard from "@/components/ForgeProcessingCard";
import ForgeReplyCard from "@/components/ForgeReplyCard";
import ForgeReportCard from "@/components/ForgeReportCard";
import { getAppointmentDisplayTitle } from "@/data/appointments";

type HomeState =
  | "finished"
  | "intervention"
  | "inProgress"
  | "reportInput"
  | "processing"
  | "review"
  | "saved"
  | "clientChoice"
  | "invoiceChoice";

type Appointment = {
  id: string;
  client: string;
  address: string;
  date: string;
  time: string;
  intervention: string;
  description?: string;
  status:
    | "scheduled"
    | "inProgress"
    | "completed"
    | "postponed"
    | "cancelled";
  notes?: string;
};

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

type ReplyStatus =
  | "idle"
  | "processing"
  | "ready"
  | "notice"
  | "error";

type HomeContentProps = {
  state: HomeState;
  currentAppointment?: Appointment;
  hideMainContent?: boolean;
  report?: InterventionReport | null;
  error?: string;
  isValidatingReport?: boolean;
  savedClientName?: string;

  onStartIntervention: () => void;
  onEditIntervention: () => void;
  onDeleteIntervention: () => void;
  onFinishIntervention: () => void;
  onExtendIntervention: () => void;
  onSaveNotes: (notes: string) => Promise<void>;
  onKeepClient: () => void;
  onDeleteTemporaryClient: () => void;

  onStartProcessing: () => void;
  onReportGenerated: (
    report: InterventionReport,
  ) => void;
  onReportError: (message: string) => void;
  onEditReport: () => void;
  onValidateReport: () => void;
  onInterventionCreated: (
    interventionId: string,
  ) => void;
  onInterventionsDeleted: (
    scheduledDate: string,
  ) => void;
  onSkipInvoice: () => void;
  onCreateInvoice: () => void;
};

export default function HomeContent({
  state,
  currentAppointment,
  hideMainContent = false,
  report,
  error,
  isValidatingReport = false,
  savedClientName,
  onStartIntervention,
  onEditIntervention,
  onDeleteIntervention,
  onFinishIntervention,
  onExtendIntervention,
  onSaveNotes,
  onKeepClient,
  onDeleteTemporaryClient,
  onStartProcessing,
  onReportGenerated,
  onReportError,
  onEditReport,
  onValidateReport,
  onInterventionCreated,
  onInterventionsDeleted,
  onSkipInvoice,
  onCreateInvoice,
}: HomeContentProps) {

  const [replyStatus, setReplyStatus] =
    useState<ReplyStatus>("idle");

  const [clientReply, setClientReply] =
    useState("");

  const [clientReplyError, setClientReplyError] =
    useState("");

  const [assistantNotice, setAssistantNotice] =
    useState("");

  const [
    originalReplyMessage,
    setOriginalReplyMessage,
  ] = useState("");

  const [replyDraft, setReplyDraft] =
    useState("");

  const [isEditingNotes, setIsEditingNotes] =
    useState(false);

  const [notesDraft, setNotesDraft] =
    useState("");

  const [isSavingNotes, setIsSavingNotes] =
    useState(false);

  const [notesError, setNotesError] =
    useState("");

  const [reportDraft, setReportDraft] =
    useState("");

  const [reportMedia, setReportMedia] =
    useState<File[]>([]);

  useEffect(() => {
    setNotesDraft(currentAppointment?.notes ?? "");
    setIsEditingNotes(false);
    setNotesError("");
  }, [currentAppointment?.id, currentAppointment?.notes]);

  const handleSaveNotes = async () => {
    if (isSavingNotes) {
      return;
    }

    setIsSavingNotes(true);
    setNotesError("");

    try {
      await onSaveNotes(notesDraft);
      setIsEditingNotes(false);
    } catch {
      setNotesError(
        "Impossible d’enregistrer les notes. Vérifiez leur contenu puis réessayez.",
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const [firstName, setFirstName] =
    useState("");

  const resetReply = () => {
    setClientReply("");
    setClientReplyError("");
    setAssistantNotice("");
    setOriginalReplyMessage("");
    setReplyDraft("");
    setReplyStatus("idle");
  };


  useEffect(() => {

    const savedFirstName =
      localStorage.getItem(
        "forgeUserFirstName",
      );

    setFirstName(
      savedFirstName?.trim() || "",
    );


  }, []);



  useEffect(() => {

    if (replyStatus !== "notice") {
      return;
    }


    const timer = window.setTimeout(() => {
      resetReply();
    }, 4000);


    return () => {
      window.clearTimeout(timer);
    };


  }, [replyStatus]);



  const getInterventionExample = () => {

    return "J’ai une intervention demain à 10h chez Charles Xavier";

  };



  const handleEditReply = () => {

    setReplyDraft(originalReplyMessage);
    setClientReply("");
    setClientReplyError("");
    setReplyStatus("idle");

  };



  const handleForgeError = (
    message: string,
  ) => {

    if (!message) {

      setClientReplyError("");
      return;

    }


    setClientReply("");
    setClientReplyError(message);
    setReplyStatus("error");

  };



  if (state === "inProgress") {

    return (

      <section className="flex flex-1 flex-col items-center justify-center px-6">


        <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-lg shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">



          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">

            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />

            Intervention en cours

          </div>



          <h2 className="text-center text-4xl font-bold text-blue-700 dark:text-blue-400">

            {currentAppointment?.client ||
              (currentAppointment
                ? getAppointmentDisplayTitle(
                    currentAppointment,
                  )
                : "Intervention")}

          </h2>



          {currentAppointment?.client && (
            <p className="mt-4 text-center text-xl font-medium text-slate-700 dark:text-slate-300">

              {getAppointmentDisplayTitle(
                currentAppointment,
              )}

            </p>
          )}



          <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:bg-slate-800 dark:text-slate-300">


            <p>
              Je garde cette intervention ouverte.
            </p>


            <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">

              Quand tu reviens, choisis l'action à effectuer ci-dessous. ↓

            </p>


          </div>

          {currentAppointment?.notes && (
            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-left dark:border-blue-900 dark:bg-blue-950">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Notes enregistrées
              </p>

              {isEditingNotes ? (
                <>
                  <textarea
                    value={notesDraft}
                    onChange={(event) =>
                      setNotesDraft(event.target.value)
                    }
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-slate-900 dark:text-white"
                  />

                  {notesError && (
                    <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
                      {notesError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleSaveNotes()}
                    disabled={isSavingNotes}
                    className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingNotes
                      ? "Enregistrement..."
                      : "Enregistrer"}
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-blue-900 dark:text-blue-100">
                    {currentAppointment.notes}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(true)}
                    className="mx-auto mt-3 block text-center text-sm font-semibold text-blue-700 dark:text-blue-300"
                  >
                    Modifier la note
                  </button>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onExtendIntervention}
            className="mt-5 w-full rounded-2xl border-2 border-blue-500 bg-white px-6 py-4 text-xl font-semibold text-blue-600 transition hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950"
          >
            Prolonger l'intervention
          </button>

          <button
            type="button"
            onClick={onFinishIntervention}
            className="mt-3 w-full rounded-2xl border-2 border-red-500 bg-white px-6 py-4 text-xl font-semibold text-red-500 transition hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950"
          >
            Terminer l'intervention
          </button>



        </div>


      </section>

    );

  }



  if (state === "finished") {

    return (

      <section className="flex flex-1 flex-col items-center justify-center px-6">


        <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-slate-900 dark:border dark:border-slate-700">


          <h2 className="text-3xl font-bold text-green-700">

            Intervention terminée

          </h2>



          <p className="mt-4 text-slate-700 dark:text-slate-300">

            Le compte rendu de l'intervention a bien été enregistré.

          </p>



          <button
            type="button"
            onClick={() => window.location.reload()}
            className="forge-back-link mt-6 justify-center rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >

            Retour 

          </button>


        </div>


      </section>

    );

  }

  if (state === "reportInput") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
        <ForgeListenCard
          clientName={
            currentAppointment?.client ||
            savedClientName ||
            "le client"
          }
          onStartProcessing={onStartProcessing}
          onReportGenerated={onReportGenerated}
          onError={onReportError}
          message={reportDraft}
          onMessageChange={setReportDraft}
          selectedMedia={reportMedia}
          onSelectedMediaChange={setReportMedia}
          errorMessage={error}
        />
      </section>
    );
  }

  if (state === "processing") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
        <ForgeProcessingCard />
      </section>
    );
  }

  if (state === "saved") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
 <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm dark:bg-slate-900 dark:border dark:border-slate-700">

    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700 dark:bg-green-950 dark:text-green-400">
      ✓
    </div>

    <h2 className="mt-5 text-2xl font-bold text-blue-700 dark:text-blue-400">
      Compte rendu enregistré
    </h2>

    <p className="mt-3 text-slate-600 dark:text-slate-300">
      L’intervention de{" "}
      <span className="font-semibold text-blue-700 dark:text-blue-400">
        {savedClientName || "ce client"}
      </span>{" "}
      a été ajoutée à son historique.
    </p>

  </div>
</section>
    );
  }

  if (state === "review") {
    if (!report) {
      return (
        <section className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-lg">
            <p className="font-medium text-red-700">
              {error ||
                "Aucun compte rendu n’a été généré."}
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
        <ForgeReportCard
          report={report}
          onEdit={onEditReport}
          onValidate={onValidateReport}
          isValidating={isValidatingReport}
          error={error}
        />
      </section>
    );
  }

  if (state === "clientChoice") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
          <h2 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">Client temporaire</h2>

          <p className="mt-4 text-slate-600 dark:text-slate-300">Ce client a été créé uniquement pour cette intervention.</p>

          <p className="mt-6 text-lg font-bold">Souhaites‑tu conserver ce client ?</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onDeleteTemporaryClient}
              className="w-full sm:w-auto rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Supprimer la fiche
            </button>

            <button
              type="button"
              onClick={onKeepClient}
              className="w-full sm:w-auto rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Garder le client
            </button>
          </div>
          {/** Affiche une erreur si la suppression échoue */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>

          )}
        </div>
      </section>
    );
  }

  if (state === "invoiceChoice") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
          <h2 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">Compte rendu enregistré</h2>

          <p className="mt-4 text-slate-700 dark:text-slate-300">
            L’intervention de{' '}
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {savedClientName || currentAppointment?.client || 'ce client'}
            </span>{' '}
            est maintenant terminée.
          </p>

          <p className="mt-6 text-lg font-bold">Souhaitez-vous créer la facture ?</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onSkipInvoice}
              className="w-full sm:w-auto rounded-full border border-slate-200 px-6 py-3 font-semibold text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Pas maintenant
            </button>

            <button
              type="button"
              onClick={onCreateInvoice}
              className="w-full sm:w-auto rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Créer la facture
            </button>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      </section>
    );
  }

  if (!currentAppointment) {
    return (
      <section className={`flex flex-1 flex-col items-center justify-center px-2 sm:px-4 ${hideMainContent ? "min-h-0 pb-0 pt-0" : "min-h-[32rem] pb-32 pt-12 sm:pb-36"}`}>
        <div className="w-full max-w-2xl">
          {replyStatus === "idle" && !hideMainContent && (
            <div className="text-center">
              <h2 className="text-4xl font-bold tracking-[-0.04em] text-blue-600 dark:text-blue-400 sm:text-5xl">
                Salut{firstName ? ` ${firstName}` : ""},
              </h2>

              <p className="mx-auto mt-7 max-w-lg text-2xl leading-9 text-slate-500 dark:text-slate-400 sm:text-3xl sm:leading-10">
                Décris-moi ta prochaine intervention.
              </p>

              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-400 dark:text-slate-500 sm:text-xl">
                Exemple : {getInterventionExample()}.
              </p>
            </div>
          )}

          {replyStatus === "processing" && (
            <div className="flex w-full flex-col items-center rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-lg shadow-slate-200/60">
              <LoaderCircle
                size={48}
                strokeWidth={2}
                className="animate-spin text-blue-600"
              />

             <h2 className="mt-5 text-2xl font-bold text-blue-700 dark:text-blue-400">
                Forge s’occupe de ta demande...
              </h2>

              <p className="mt-2 text-slate-500">
                Cela ne prendra que quelques secondes.
              </p>
            </div>
          )}

          {replyStatus === "notice" && (
            <div className="w-full rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center shadow-lg shadow-blue-100/50">
              <h2 className="text-2xl font-bold text-blue-700">
                C&apos;est fait !
              </h2>

              <p className="mt-3 text-blue-700">
                {assistantNotice}
              </p>
            </div>
          )}

          {replyStatus === "error" && (
            <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-lg">
              <p className="font-medium text-red-700">
                {clientReplyError ||
                  "Impossible de traiter la demande."}
              </p>

              <button
                type="button"
                onClick={resetReply}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        <FixedForgeBar
          context="home"
          initialMessage={replyDraft}
          onInitialMessageUsed={() => {
            setReplyDraft("");
          }}
          onStartReply={(originalMessage) => {
            resetReply();
            setOriginalReplyMessage(
              originalMessage,
            );
            setClientReply("");
            setClientReplyError("");
            setReplyStatus("processing");
          }}
          onReplyGenerated={(generatedReply) => {
            setClientReply(generatedReply);
            setClientReplyError("");
            setReplyStatus("ready");
          }}
          onInterventionCreated={(
            interventionId,
          ) => {
            resetReply();

            onInterventionCreated(
              interventionId,
            );
          }}
          onInterventionsDeleted={
            onInterventionsDeleted
          }
          onAssistantNotice={(message) => {
            setAssistantNotice(message);
            setClientReply("");
            setClientReplyError("");
            setReplyStatus("notice");
          }}
          onReplyError={handleForgeError}
        />
      </section>
    );
  }

  return (
    <section
      className="flex min-h-0 shrink-0 flex-col items-center px-2 pb-3 pt-1 sm:px-4"
    >
      <div className="w-full max-w-2xl">
       {replyStatus === "idle" && !hideMainContent && (
  <CurrentInterventionCard
  appointment={currentAppointment}
  isInProgress={currentAppointment.status === "inProgress"}
  onStart={onStartIntervention}
  onEdit={onEditIntervention}
  onDelete={onDeleteIntervention}
/>
)}

        {replyStatus === "processing" && (
          <div className="flex w-full flex-col items-center rounded-3xl border border-slate-100 bg-white p-10 text-center shadow-lg shadow-slate-200/60">
            <LoaderCircle
              size={48}
              strokeWidth={2}
              className="animate-spin text-blue-600"
            />

           <h2 className="mt-5 text-2xl font-bold text-blue-700 dark:text-blue-400">
              Je prépare ta réponse...
            </h2>

            <p className="mt-2 text-slate-500">
              Cela ne prendra que quelques secondes.
            </p>
          </div>
        )}

        {replyStatus === "ready" &&
          clientReply && (
            <ForgeReplyCard
              reply={clientReply}
              onEdit={handleEditReply}
              onCopied={resetReply}
            />
          )}

        {replyStatus === "notice" && (
          <div className="w-full rounded-3xl border border-blue-200 bg-blue-50 p-8 text-center shadow-lg shadow-blue-100/50">
            <h2 className="text-2xl font-bold text-blue-700">
              C&apos;est fait !
            </h2>

            <p className="mt-3 text-blue-700">
              {assistantNotice}
            </p>
          </div>
        )}

        {replyStatus === "error" && (
          <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center shadow-lg">
            <p className="font-medium text-red-700">
              {clientReplyError ||
                "Impossible de préparer la réponse."}
            </p>

            <button
              type="button"
              onClick={resetReply}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      <FixedForgeBar
        context="home"
        initialMessage={replyDraft}
        onInitialMessageUsed={() => {
          setReplyDraft("");
        }}
        onStartReply={(originalMessage) => {
          resetReply();
          setOriginalReplyMessage(originalMessage);
          setClientReply("");
          setClientReplyError("");
          setReplyStatus("processing");
        }}
        onReplyGenerated={(generatedReply) => {
          setClientReply(generatedReply);
          setClientReplyError("");
          setReplyStatus("ready");
        }}
        onInterventionCreated={(interventionId) => {
          resetReply();
          onInterventionCreated(interventionId);
        }}
        onInterventionsDeleted={onInterventionsDeleted}
        onAssistantNotice={(message) => {
          setAssistantNotice(message);
          setClientReply("");
          setClientReplyError("");
          setReplyStatus("notice");
        }}
        onReplyError={handleForgeError}
      />
    </section>
  );
}
