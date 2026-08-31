/**
 * Limiteur de débit best-effort, en mémoire du process.
 *
 * Sur un hébergement serverless (Vercel), la mémoire n'est pas partagée entre
 * instances : ce frein ralentit un abuseur sur une instance « chaude » mais ne
 * remplace pas un vrai limiteur (Redis/Upstash). Il échoue en mode ouvert :
 * en cas de doute, la requête passe.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  try {
    const now = Date.now();
    const bucket = store.get(key);

    if (!bucket || bucket.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });

      return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
      };
    }

    bucket.count += 1;

    return {
      allowed: true,
      remaining: limit - bucket.count,
      retryAfterSeconds: 0,
    };
  } catch {
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

// Nettoyage opportuniste pour éviter que la Map ne grossisse indéfiniment.
if (typeof setInterval === "function") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }, 60_000);

  // Ne pas empêcher le process de se terminer.
  (timer as { unref?: () => void }).unref?.();
}
