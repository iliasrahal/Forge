type WorkspaceIdentity = {
  type: "PERSONAL" | "TEAM";
  name: string;
  legalName?: string | null;
};

type PersonalIdentity = {
  emailSignature?: string | null;
  firstName?: string | null;
};

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

export function resolveDocumentEmailSignature(
  workspace: WorkspaceIdentity,
  user: PersonalIdentity,
) {
  const personalSignature =
    clean(user.emailSignature) ?? clean(user.firstName) ?? "L'équipe Forge";

  if (workspace.type === "PERSONAL") {
    return personalSignature;
  }

  return clean(workspace.legalName) ?? clean(workspace.name) ?? personalSignature;
}
