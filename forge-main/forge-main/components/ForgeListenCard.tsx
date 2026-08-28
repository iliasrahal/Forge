"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Camera,
  Images,
  LoaderCircle,
  Mic,
  Play,
  Send,
  Video,
  X,
} from "lucide-react";

import {
  MAX_MEDIA,
  MAX_PHOTOS,
  MAX_PHOTO_SIZE,
  MAX_VIDEO_DURATION_SECONDS,
  MAX_VIDEO_SIZE,
  MAX_VIDEOS,
} from "@/src/lib/photoConfig";
import {
  extractVideoFrames,
  getVideoDuration,
} from "@/src/lib/videoFrames";

type ListenRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
};

type ListenRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: ListenRecognitionEvent) => void) | null;
  start: () => void;
};

type ListenRecognitionConstructor =
  new () => ListenRecognition;

type ForgeListenWindow = Window & {
  SpeechRecognition?: ListenRecognitionConstructor;
  webkitSpeechRecognition?: ListenRecognitionConstructor;
};

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
  message: string;
  onMessageChange: (message: string) => void;
  selectedMedia: File[];
  onSelectedMediaChange: (media: File[]) => void;
  errorMessage?: string;
};

function MediaPreview({
  media,
  index,
  isLoading,
  onRemove,
}: {
  media: File;
  index: number;
  isLoading: boolean;
  onRemove: () => void;
}) {
  const [previewUrl] = useState(() => URL.createObjectURL(media));
  const isVideo = media.type.startsWith("video/");

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="group relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {isVideo ? (
        <>
          <video
            src={previewUrl}
            muted
            playsInline
            preload="auto"
            aria-label={`Aperçu de la vidéo ${index + 1}`}
            className="h-full w-full object-cover"
          />
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/15 text-white">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-950/65 backdrop-blur-sm">
              <Play size={13} fill="currentColor" />
            </span>
          </span>
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={`Aperçu de la photo ${index + 1}`}
          className="h-full w-full object-cover"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={isLoading}
        aria-label={`Retirer ${isVideo ? "la vidéo" : "la photo"} ${index + 1}`}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/75 text-white shadow-sm backdrop-blur-sm transition hover:bg-red-600 disabled:opacity-50"
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function ForgeListenCard({
  clientName,
  onStartProcessing,
  onReportGenerated,
  onError,
  message,
  onMessageChange,
  selectedMedia,
  onSelectedMediaChange,
  errorMessage = "",
}: ForgeListenCardProps) {

  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [isMediaMenuOpen, setIsMediaMenuOpen] = useState(false);
  const photoCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const videoCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const selectedMediaRef = useRef(selectedMedia);

  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  function openMediaInput(
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) {
    setIsMediaMenuOpen(false);
    inputRef.current?.click();
  }

  async function handleMediaSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const newMedia = Array.from(event.target.files ?? []).filter(
      (file) =>
        file.type.startsWith("image/") ||
        file.type.startsWith("video/"),
    );

    event.target.value = "";
    setIsMediaMenuOpen(false);

    if (newMedia.length === 0) {
      return;
    }

    if (selectedMedia.length + newMedia.length > MAX_MEDIA) {
      setMediaError(`Tu peux ajouter au maximum ${MAX_MEDIA} médias.`);
      return;
    }

    const photos = newMedia.filter((file) =>
      file.type.startsWith("image/"),
    );
    const videos = newMedia.filter((file) =>
      file.type.startsWith("video/"),
    );
    const existingVideoCount = selectedMedia.filter((file) =>
      file.type.startsWith("video/"),
    ).length;

    if (existingVideoCount + videos.length > MAX_VIDEOS) {
      setMediaError("Tu peux ajouter une seule vidéo par compte rendu.");
      return;
    }

    const oversizedPhoto = photos.find(
      (photo) => photo.size > MAX_PHOTO_SIZE,
    );

    if (oversizedPhoto) {
      setMediaError("Chaque photo doit peser au maximum 8 Mo.");
      return;
    }

    if (
      selectedMedia.filter((file) =>
        file.type.startsWith("image/"),
      ).length + photos.length > MAX_PHOTOS
    ) {
      setMediaError(`Tu peux ajouter au maximum ${MAX_PHOTOS} photos.`);
      return;
    }

    const oversizedVideo = videos.find(
      (video) => video.size > MAX_VIDEO_SIZE,
    );

    if (oversizedVideo) {
      setMediaError("La vidéo doit peser au maximum 50 Mo.");
      return;
    }

    for (const video of videos) {
      try {
        const duration = await getVideoDuration(video);

        if (duration > MAX_VIDEO_DURATION_SECONDS) {
          setMediaError("La vidéo doit durer au maximum 30 secondes.");
          return;
        }
      } catch {
        setMediaError(
          "Cette vidéo ne peut pas être analysée sur cet appareil. Essayez une autre vidéo ou filmez directement depuis Forge.",
        );
        return;
      }
    }

    setMediaError("");
    onSelectedMediaChange([...selectedMedia, ...newMedia]);
  }

  function removeMedia(index: number) {
    onSelectedMediaChange(
      selectedMedia.filter((_, mediaIndex) => mediaIndex !== index),
    );
    setMediaError("");
  }


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

      const currentMedia = selectedMediaRef.current;
      const formData = new FormData();
      formData.append("intervention", intervention);
      const photos = currentMedia.filter((file) =>
        file.type.startsWith("image/"),
      );
      const video = currentMedia.find((file) =>
        file.type.startsWith("video/"),
      );

      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      if (video) {
        let videoFrames: File[];

        try {
          videoFrames = await extractVideoFrames(video);
        } catch {
          throw new Error(
            "Cette vidéo ne peut pas être analysée sur cet appareil. Essayez une autre vidéo ou filmez directement depuis Forge.",
          );
        }

        videoFrames.forEach((frame) => {
          formData.append("photos", frame);
        });
        formData.append(
          "videoFrameCount",
          String(videoFrames.length),
        );
      }

      const response = await fetch(
        "/api/interventions/report",
        {
          method: "POST",
          body: formData,
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


      onMessageChange("");
      onSelectedMediaChange([]);

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

    const browserWindow = window as ForgeListenWindow;
    const SpeechRecognition =
      browserWindow.SpeechRecognition ||
      browserWindow.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      onError(
        "La reconnaissance vocale n'est pas disponible sur ce navigateur.",
      );

      return;
    }

    const recognition = new SpeechRecognition();


    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;


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
      event: ListenRecognitionEvent,
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


      onMessageChange(transcript);


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

        className={`mx-auto mt-10 flex h-40 w-40 items-center justify-center rounded-full border-2 border-blue-600 bg-white text-blue-600 shadow-lg shadow-blue-100 transition hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-400 dark:shadow-blue-900/30 dark:hover:bg-slate-800 ${
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
          ref={photoCaptureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void handleMediaSelection(event)}
          className="hidden"
        />

        <input
          ref={videoCaptureInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={(event) => void handleMediaSelection(event)}
          className="hidden"
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(event) => void handleMediaSelection(event)}
          className="hidden"
        />


        <input
          type="text"
          value={message}
          onChange={(event)=>
            onMessageChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="ou écris-le moi..."

          className="min-w-0 flex-1 bg-transparent text-lg text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
        />




        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMediaMenuOpen((isOpen) => !isOpen)}
            aria-label="Ajouter un média"
            aria-expanded={isMediaMenuOpen}
            disabled={isLoading || selectedMedia.length >= MAX_MEDIA}
            className="flex h-12 w-12 items-center justify-center rounded-full text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white dark:hover:bg-slate-800"
          >
            <Camera size={27}/>
          </button>

          {isMediaMenuOpen && (
            <div className="absolute bottom-14 right-0 z-20 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 text-left shadow-xl shadow-slate-900/15 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
              <button
                type="button"
                onClick={() => openMediaInput(photoCaptureInputRef)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                <Camera size={18} /> Prendre une photo
              </button>
              <button
                type="button"
                onClick={() => openMediaInput(videoCaptureInputRef)}
                disabled={selectedMedia.some((file) => file.type.startsWith("video/"))}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                <Video size={18} /> Filmer une vidéo
              </button>
              <button
                type="button"
                onClick={() => openMediaInput(galleryInputRef)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                <Images size={18} /> Choisir dans la galerie
              </button>
            </div>
          )}
        </div>





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

      {selectedMedia.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Médias sélectionnés">
          {selectedMedia.map((media, index) => (
            <MediaPreview
              key={`${media.name}-${media.lastModified}-${index}`}
              media={media}
              index={index}
              isLoading={isLoading}
              onRemove={() => removeMedia(index)}
            />
          ))}
        </div>
      )}

      {mediaError && (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          {mediaError}
        </p>
      )}

      {errorMessage && (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}


    </section>

  );
}
