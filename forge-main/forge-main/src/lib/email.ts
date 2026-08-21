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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
