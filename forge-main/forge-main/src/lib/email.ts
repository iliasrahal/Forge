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
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p>Bienvenue sur Forge. Ton espace est prêt.</p><p>À bientôt,<br/>L'équipe Forge</p>`,
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
    html: `<p>Bonjour ${escapeHtml(firstName)},</p><p>La suppression de ton compte Forge a bien été prise en compte. Tes données ont été supprimées.</p><p>À bientôt,<br/>L'équipe Forge</p>`,
  });
}


export async function sendQuoteEmail(
  recipient: string,
  clientName: string,
  artisanName: string,
  quoteTitle: string,
  quoteDescription: string,
  pdfBuffer: Buffer,
  fileName: string,
) {
  return getResendClient().emails.send({

    from: sender,

    to: recipient,

    subject: `Votre devis Forge - ${quoteTitle}`,

    text:
`Bonjour ${clientName},

Veuillez trouver ci-joint votre devis concernant :
${quoteDescription}

Je reste à votre disposition pour toute question ou précision concernant cette proposition.

Merci pour votre confiance.

Cordialement,

${artisanName}
`,

    html:
`
<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:640px">
<p>Bonjour ${escapeHtml(clientName)},</p>

<p>Veuillez trouver ci-joint votre devis concernant :</p>
<p style="font-weight:600;color:#1d4ed8">${escapeHtml(quoteDescription)}</p>

<p>Je reste à votre disposition pour toute question ou précision concernant cette proposition.</p>

<p>Merci pour votre confiance.</p>

<p>
Cordialement,<br/>
${escapeHtml(artisanName)}
</p>
</div>
`,

    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],

  });
}


export async function sendInvoiceEmail(
  recipient: string,
  clientName: string,
  artisanName: string,
  invoiceReference: string,
  interventionDescription: string,
  pdfBuffer: Buffer,
  fileName: string,
) {
  return getResendClient().emails.send({

    from: sender,

    to: recipient,

    subject: `Votre facture Forge - ${invoiceReference}`,

    text:
`Bonjour ${clientName},

Veuillez trouver ci-joint votre facture concernant :
${interventionDescription}

Je reste disponible si vous avez besoin d'informations complémentaires.

Merci pour votre confiance.

Cordialement,

${artisanName}
`,

    html:
`
<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:640px">
<p>Bonjour ${escapeHtml(clientName)},</p>

<p>Veuillez trouver ci-joint votre facture concernant :</p>
<p style="font-weight:600;color:#1d4ed8">${escapeHtml(interventionDescription)}</p>

<p>Je reste disponible si vous avez besoin d'informations complémentaires.</p>

<p>Merci pour votre confiance.</p>

<p>
Cordialement,<br/>
${escapeHtml(artisanName)}
</p>
</div>
`,

    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],

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
