"use client";

import ForgeBar from "@/components/ForgeBar";

type FixedForgeBarProps = {
  context: "home" | "clients" | "quotes";
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
}: FixedForgeBarProps) {
  return (
    <div className="fixed bottom-28 left-1/2 z-40 w-full max-w-xl -translate-x-1/2 px-6">
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
    </div>
  );
}
