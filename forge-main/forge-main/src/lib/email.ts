import { Resend } from "resend";

import type { InvoiceDescriptionSection } from "@/src/lib/invoiceDescription";

const sender = "Forge <contact@myforge.online>";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY est absente.");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function getFirstName(firstName: string) {
  return firstName.trim() || "utilisateur Forge";
}

function renderEmailLayout(
  content: string,
  action?: {
    label: string;
    url: string;
  },
  showFooterLogo = false,
) {
  const actionHtml = action
    ? `<p style="margin:28px 0;text-align:center"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px">${escapeHtml(action.label)}</a></p>`
    : "";
  const renderedContent = action
    ? content.replace("{{ACTION}}", actionHtml)
    : content;
  const appUrl = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://myforge.online"
  ).replace(/\/$/, "");
  const emailLogoUrl = escapeHtml(`${appUrl}/myforge-email-symbol.png`);
  const logoHtml = (width: number) => {
    const height = Math.round(width * 0.7);

    return `<img src="${emailLogoUrl}" width="${width}" height="${height}" alt="MyForge" style="display:block;width:${width}px;height:${height}px;margin:0 auto;border:0;object-fit:contain"/>`;
  };
  const footerLogo = showFooterLogo
    ? `<div style="margin-top:28px;padding-top:22px;border-top:1px solid #e2e8f0;text-align:center">${logoHtml(88)}</div>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    @media (prefers-color-scheme: dark) {
      .forge-email-body { background: #020617 !important; color: #e2e8f0 !important; }
      .forge-email-card { background: #0f172a !important; border-color: #334155 !important; }
      .forge-email-header { border-color: #334155 !important; }
      .forge-email-footer { color: #94a3b8 !important; }
    }
  </style>
</head>
<body class="forge-email-body" style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px">
    <div class="forge-email-card" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden">
      <div class="forge-email-header" style="padding:14px 28px;border-bottom:1px solid #e2e8f0;text-align:center">${logoHtml(104)}</div>
      <div style="padding:28px;font-size:16px;line-height:1.65">
        ${renderedContent}
        ${footerLogo}
      </div>
    </div>
    <p class="forge-email-footer" style="margin:18px 0 0;text-align:center;color:#94a3b8;font-size:12px">Forge — L’assistant des artisans</p>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  recipient: string,
  firstName: string,
) {
  const userFirstName = getFirstName(firstName);

  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Bienvenue sur Forge",
    text: `Bonjour ${userFirstName},\n\nBienvenue sur Forge. Votre espace est prêt.\n\nCordialement,\n\nL'équipe Forge`,
    html: renderEmailLayout(`<p>Bonjour ${escapeHtml(userFirstName)},</p><p>Bienvenue sur Forge. Votre espace est prêt.</p><p>Cordialement,<br/><strong>L'équipe Forge</strong></p>`),
  });
}

export async function sendTeamInvitationEmail(
  recipient: string,
  organizationName: string,
  invitationUrl: string,
) {
  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: `Invitation à rejoindre ${organizationName} sur Forge`,
    text: `Vous êtes invité à rejoindre l’équipe Forge de ${organizationName}.\n\nRejoignez l’équipe avec ce lien :\n${invitationUrl}\n\nCe lien est personnel et valable pendant 24 heures.`,
    html: renderEmailLayout(
      `<p>Vous êtes invité à rejoindre l’équipe Forge de <strong>${escapeHtml(organizationName)}</strong>.</p><p>Connectez-vous avec votre compte Forge ou créez-en un pour rejoindre cet espace.</p>{{ACTION}}<p>Ce lien est personnel et valable pendant 7 jours.</p><p>Cordialement,<br/><strong>L’équipe Forge</strong></p>`,
      { label: "Rejoindre l’équipe Forge", url: invitationUrl },
      true,
    ),
  });
}


export async function sendPasswordResetEmail(
  recipient: string,
  firstName: string,
  resetUrl: string,
) {
  const userFirstName = getFirstName(firstName);

  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Réinitialisation de votre mot de passe Forge",
    text: `Bonjour ${userFirstName},\n\nVous avez demandé la réinitialisation de votre mot de passe Forge.\n\nCliquez sur le lien suivant pour choisir un nouveau mot de passe :\n${resetUrl}\n\nCe lien est valable pendant une durée limitée pour des raisons de sécurité.\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\nCordialement,\n\nL'équipe Forge`,
    html: renderEmailLayout(
      `<p>Bonjour ${escapeHtml(userFirstName)},</p><p>Vous avez demandé la réinitialisation de votre mot de passe Forge.</p><p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>{{ACTION}}<p>Ce lien est valable pendant une durée limitée pour des raisons de sécurité.</p><p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p><p>Cordialement,<br/><strong>L'équipe Forge</strong></p>`,
      {
        label: "Réinitialiser mon mot de passe",
        url: resetUrl,
      },
      true,
    ),
  });
}


export async function sendActivationEmail(
  recipient: string,
  firstName: string,
  activationUrl: string,
) {
  const userFirstName = getFirstName(firstName);

  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Vérification de votre adresse email Forge",
    text: `Bonjour ${userFirstName},\n\nBienvenue sur Forge.\n\nPour finaliser la création de votre compte et sécuriser votre accès, veuillez confirmer votre adresse email :\n${activationUrl}\n\nCette étape permet de protéger votre compte et vos informations.\n\nMerci de rejoindre Forge.\n\nCordialement,\n\nL'équipe Forge`,
    html: renderEmailLayout(
      `<p>Bonjour ${escapeHtml(userFirstName)},</p><p>Bienvenue sur Forge.</p><p>Pour finaliser la création de votre compte et sécuriser votre accès, veuillez confirmer votre adresse email :</p>{{ACTION}}<p>Cette étape permet de protéger votre compte et vos informations.</p><p>Merci de rejoindre Forge.</p><p>Cordialement,<br/><strong>L'équipe Forge</strong></p>`,
      {
        label: "Vérifier mon adresse email",
        url: activationUrl,
      },
      true,
    ),
  });
}


export async function sendAccountDeletedEmail(
  recipient: string,
  firstName: string,
) {
  const userFirstName = getFirstName(firstName);

  return getResendClient().emails.send({
    from: sender,
    to: recipient,
    subject: "Ton compte Forge a été supprimé",
    text: `Bonjour ${userFirstName},\n\nLa suppression de votre compte Forge a bien été prise en compte. Vos données ont été supprimées.\n\nCordialement,\n\nL'équipe Forge`,
    html: renderEmailLayout(`<p>Bonjour ${escapeHtml(userFirstName)},</p><p>La suppression de votre compte Forge a bien été prise en compte. Vos données ont été supprimées.</p><p>Cordialement,<br/><strong>L'équipe Forge</strong></p>`),
  });
}


export async function sendQuoteEmail(
  recipient: string,
  clientName: string,
  artisanSignature: string,
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

${artisanSignature}
`,

    html: renderEmailLayout(`
<p>Bonjour ${escapeHtml(clientName)},</p>

<p>Veuillez trouver ci-joint votre devis concernant :</p>
<p style="font-weight:600;color:#1d4ed8">${escapeHtml(quoteDescription)}</p>

<p>Je reste à votre disposition pour toute question ou précision concernant cette proposition.</p>

<p>Merci pour votre confiance.</p>

<p>
Cordialement,<br/>
${formatEmailSignature(artisanSignature)}
</p>
`),

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
  artisanSignature: string,
  invoiceReference: string,
  interventionSections: InvoiceDescriptionSection[],
  pdfBuffer: Buffer,
  fileName: string,
) {
  const structuredText = interventionSections
    .map(({ label, content }) => `${label}\n${content}`)
    .join("\n\n");
  const structuredHtml = interventionSections
    .map(
      ({ label, content }) =>
        `<div style="margin-top:12px;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc"><p style="margin:0;color:#1d4ed8;font-size:14px;font-weight:700">${escapeHtml(label)}</p><p style="margin:8px 0 0;color:#334155;line-height:1.6">${escapeHtml(content).replace(/\n/g, "<br/>")}</p></div>`,
    )
    .join("");

  return getResendClient().emails.send({

    from: sender,

    to: recipient,

    subject: `Votre facture Forge - ${invoiceReference}`,

    text:
`Bonjour ${clientName},

Veuillez trouver ci-joint votre facture concernant :
${structuredText}

Je reste disponible si vous avez besoin d'informations complémentaires.

Merci pour votre confiance.

Cordialement,

${artisanSignature}
`,

    html: renderEmailLayout(`
<p>Bonjour ${escapeHtml(clientName)},</p>

<p>Veuillez trouver ci-joint votre facture concernant :</p>
${structuredHtml}

<p>Je reste disponible si vous avez besoin d'informations complémentaires.</p>

<p>Merci pour votre confiance.</p>

<p>
Cordialement,<br/>
${formatEmailSignature(artisanSignature)}
</p>
`),

    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
      },
    ],

  });
}

function formatEmailSignature(
  value: string,
) {
  return escapeHtml(value).replace(
    /\r?\n/g,
    "<br/>",
  );
}


function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
