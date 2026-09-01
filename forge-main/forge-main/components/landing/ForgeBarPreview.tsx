import {
  Camera,
  Mic,
  Send,
} from "lucide-react";

type ForgeBarPreviewProps = {
  text: string;
};

export default function ForgeBarPreview({
  text,
}: ForgeBarPreviewProps) {
  return (
    <div className="forge-bar flex min-h-20 w-full items-center gap-2 rounded-3xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:gap-3 sm:px-5">
      <p className="min-w-0 flex-1 truncate text-sm text-slate-500 dark:text-slate-300 sm:text-base">
        {text}
      </p>

      <span
        aria-label="Ajouter une photo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400 sm:h-12 sm:w-12"
      >
        <Camera size={22} strokeWidth={2.2} />
      </span>
      <span
        aria-label="Parler à Forge"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-600 bg-white text-blue-600 dark:bg-slate-900 dark:text-blue-400 sm:h-12 sm:w-12"
      >
        <Mic size={22} strokeWidth={2.2} />
      </span>
      <span
        aria-label="Envoyer à Forge"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 sm:h-12 sm:w-12"
      >
        <Send size={20} strokeWidth={2.3} />
      </span>
    </div>
  );
}
