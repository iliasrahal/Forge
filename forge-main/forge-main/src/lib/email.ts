import { Resend } from "resend";

const sender = "Forge <contact@myforge.online>";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY est absente.");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendWelcomeEmail(
  recipient: string,
  firstName: string,
) {
  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Bienvenue sur Forge",
    text: `Bonjour ${firstName},\n\nBienvenue sur Forge. Ton espace est prêt.\n\nÀ bientôt,\nL'équipe Forge`,
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p>Bienvenue sur Forge. Ton espace est prêt.</p><p>À bientôt,<br>L'équipe Forge</p>`,
  });
}

export async function sendPasswordResetEmail(
  recipient: string,
  firstName: string,
  resetUrl: string,
) {
  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Réinitialise ton mot de passe Forge",
    text: `Bonjour ${firstName},\n\nRéinitialise ton mot de passe ici : ${resetUrl}\n\nCe lien expire dans 30 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.`,
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p><a href="${escapeHtml(resetUrl)}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 30 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>`,
  });
}

export async function sendActivationEmail(
  recipient: string,
  firstName: string,
  activationUrl: string,
) {
  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Active ton compte Forge",
    text: `Bonjour ${firstName},\n\nBienvenue sur Forge. Active ton compte ici : ${activationUrl}\n\nCe lien expire dans 24 heures.`,
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p>Bienvenue sur Forge.</p><p><a href="${escapeHtml(activationUrl)}">Activer mon compte</a></p><p>Ce lien expire dans 24 heures.</p>`,
  });
}

export async function sendAccountDeletedEmail(
  recipient: string,
  firstName: string,
) {
  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Ton compte Forge a été supprimé",
    text: `Bonjour ${firstName},\n\nLa suppression de ton compte Forge a bien été prise en compte. Tes données ont été supprimées.\n\nÀ bientôt,\nL'équipe Forge`,
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p>La suppression de ton compte Forge a bien été prise en compte. Tes données ont été supprimées.</p><p>À bientôt,<br>L'équipe Forge</p>`,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
