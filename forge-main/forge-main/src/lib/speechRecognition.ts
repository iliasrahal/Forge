export function getSpeechRecognitionErrorMessage(
  error?: string,
) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "L’accès au microphone a été refusé. Autorisez le micro dans les réglages du navigateur, puis réessayez.";
    case "audio-capture":
      return "Aucun microphone n’est disponible. Vérifiez les réglages de votre appareil, puis réessayez.";
    case "no-speech":
      return "Je n’ai entendu aucune parole. Rapprochez-vous du micro, puis réessayez.";
    case "network":
      return "La reconnaissance vocale nécessite une connexion internet. Vérifiez votre connexion, puis réessayez.";
    default:
      return "Impossible d’utiliser le micro pour le moment. Réessayez ou écrivez votre demande.";
  }
}

export function getSpeechRecognitionStartErrorMessage(
  error: unknown,
) {
  if (
    error instanceof DOMException &&
    error.name === "NotAllowedError"
  ) {
    return getSpeechRecognitionErrorMessage(
      "not-allowed",
    );
  }

  return getSpeechRecognitionErrorMessage();
}

