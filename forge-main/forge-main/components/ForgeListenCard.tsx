"use client";

import { useState } from "react";
import {
  Camera,
  LoaderCircle,
  Mic,
  Send,
} from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type InterventionReport = {
  intervention: string;
  diagnostic: string;
  travaux: string;
  recommandation: string;
};

type ForgeListenCardProps = {
  clientName: string;
  onStartProcessing: () => void;
  onReportGenerated: (
    report: InterventionReport,
  ) => void;
  onError: (message: string) => void;
};

export default function ForgeListenCard({
  clientName,
  onStartProcessing,
  onReportGenerated,
  onError,
}: ForgeListenCardProps) {

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);


  async function handleSubmit(text?: string) {

    const intervention =
      (text ?? message).trim();

    if (!intervention || isLoading) {
      return;
    }

    setIsLoading(true);
    onError("");
    onStartProcessing();


    try {

      const response = await fetch(
        "/api/interventions/report",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            intervention,
          }),
        },
      );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Impossible de créer le compte rendu.",
        );
      }


      onReportGenerated({

        intervention:
          data.intervention ||
          "Non précisé",

        diagnostic:
          data.diagnostic ||
          "Non précisé",

        travaux:
          data.travaux ||
          "Non précisé",

        recommandation:
          data.recommandation ||
          "Aucune recommandation particulière.",

      });


    } catch (error) {

      onError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );


    } finally {

      setIsLoading(false);

    }
  }



  function startVoiceRecognition() {

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      onError(
        "La reconnaissance vocale n'est pas disponible sur ce navigateur.",
      );

      return;
    }


    const recognition =
      new SpeechRecognition();


    recognition.lang =
      "fr-FR";

    recognition.continuous =
      false;

    recognition.interimResults =
      false;


    recognition.onstart = () => {
      setIsListening(true);
    };


    recognition.onend = () => {
      setIsListening(false);
    };


    recognition.onerror = () => {

      setIsListening(false);

      onError(
        "Impossible d'utiliser le micro.",
      );
    };


    recognition.onresult = (
      event:any,
    ) => {

      let transcript = "";


      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        transcript +=
          event.results[i][0]
            .transcript;

      }


      setMessage(transcript);


      if (transcript.trim()) {

        setTimeout(() => {

          void handleSubmit(
            transcript,
          );

        },800);

      }

    };


    recognition.start();

  }



  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {

    if(event.key === "Enter") {

      event.preventDefault();

      void handleSubmit();

    }

  }



  return (

    <section className="w-full text-center">


      <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
        Chez {clientName}
      </p>



      <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-blue-600" />



      <h2 className="mt-6 text-3xl font-bold leading-tight text-slate-950 dark:text-white">

        Dis-moi ce qui
        <br />
        a été fait.

      </h2>




      <button
        type="button"
        onClick={startVoiceRecognition}
        aria-label="Commencer l’enregistrement vocal"

        className={`mx-auto mt-10 flex h-40 w-40 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600 shadow-lg shadow-blue-100 transition hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-400 dark:shadow-blue-900/40 ${
          isListening
            ? "bg-blue-50 dark:bg-blue-950 animate-pulse"
            : ""
        }`}
      >

        <Mic
          size={70}
          strokeWidth={1.8}
        />

      </button>




      <p className="mt-4 text-base font-medium text-slate-600 dark:text-slate-300">

        {isListening
          ? "Je t'écoute..."
          : "Appuie pour parler"}

      </p>





      <div className="mt-8 flex min-h-20 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-md shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">


        <input
          type="text"
          value={message}
          onChange={(event)=>
            setMessage(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="ou écris-le moi..."

          className="min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />




        <button
          type="button"
          aria-label="Ajouter une photo"

          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
        >

          <Camera size={27}/>

        </button>





        <button
          type="button"
          onClick={() =>
            void handleSubmit()
          }
          disabled={
            !message.trim() ||
            isLoading
          }

          aria-label="Envoyer"

          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >


          {isLoading ? (

            <LoaderCircle
              size={24}
              className="animate-spin"
            />

          ) : (

            <Send size={22}/>

          )}


        </button>


      </div>


    </section>

  );
}