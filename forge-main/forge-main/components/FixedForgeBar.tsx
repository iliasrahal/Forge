"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import ForgeBar from "@/components/ForgeBar";

type FixedForgeBarProps = {
  context: "home" | "clients" | "quotes" | "invoices";
  clientId?: string;
  clientName?: string;
  initialMessage?: string;
  onInitialMessageUsed?: () => void;
  onStartReply?: (originalMessage: string) => void;
  onReplyGenerated?: (reply: string) => void;
  onReplyError?: (message: string) => void;
  onAssistantNotice?: (message: string) => void;
  onInterventionCreated?: (
    interventionId: string,
  ) => void;
  onInterventionsDeleted?: (
    scheduledDate: string,
  ) => void;
  reserveMobileSpace?: boolean;
};

export default function FixedForgeBar({
  context,
  clientId,
  clientName,
  initialMessage,
  onInitialMessageUsed,
  onStartReply,
  onReplyGenerated,
  onReplyError,
  onAssistantNotice,
  onInterventionCreated,
  onInterventionsDeleted,
  reserveMobileSpace = true,
}: FixedForgeBarProps) {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  return (
    <>
      <div
        aria-hidden="true"
        className={`${reserveMobileSpace ? "h-28" : "hidden sm:block"} shrink-0 sm:h-32`}
      />
      {isMounted ? createPortal(
    <div className="fixed inset-x-0 bottom-[calc(4.75rem+max(0.5rem,env(safe-area-inset-bottom)))] z-40 mx-auto w-full max-w-xl px-2 sm:bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:left-60 lg:bottom-6 lg:max-w-2xl">
      <ForgeBar
        context={context}
        clientId={clientId}
        clientName={clientName}
        initialMessage={initialMessage}
        onInitialMessageUsed={onInitialMessageUsed}
        onStartReply={onStartReply}
        onReplyGenerated={onReplyGenerated}
        onReplyError={onReplyError}
        onAssistantNotice={onAssistantNotice}
        onInterventionCreated={
          onInterventionCreated
        }
        onInterventionsDeleted={
          onInterventionsDeleted
        }
      />
    </div>,
    document.body,
      ) : null}
    </>
  );
}
