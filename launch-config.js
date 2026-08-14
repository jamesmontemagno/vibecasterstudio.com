const APP_ORIGIN = "https://app.vibecasterstudio.com";
const MAX_ROUTE_VERIFICATION_AGE_DAYS = 7;

export const launchConfig = Object.freeze({
  invitedHostSignIn: Object.freeze({
    enabled: false,
    url: "",
    verification: Object.freeze({
      publicFactsApproval: "",
      releaseEvidenceReference: "",
      routeVerifiedAt: "",
      verifiedRoute: "",
    }),
  }),
  publicMetadata: Object.freeze({
    enabled: false,
    canonicalUrl: "",
    socialImageUrl: "",
  }),
});

export function getVerifiedSignInUrl(config, now = new Date()) {
  const signIn = config?.invitedHostSignIn;
  const verification = signIn?.verification;

  if (
    signIn?.enabled !== true ||
    typeof signIn.url !== "string" ||
    !verification?.publicFactsApproval ||
    !verification.releaseEvidenceReference ||
    !verification.routeVerifiedAt ||
    !verification.verifiedRoute
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(signIn.url);
  } catch {
    return null;
  }

  if (url.href !== `${APP_ORIGIN}/` || verification.verifiedRoute !== url.href) {
    return null;
  }

  const verifiedAt = new Date(verification.routeVerifiedAt);
  const verificationAge = now.getTime() - verifiedAt.getTime();
  const maxAge = MAX_ROUTE_VERIFICATION_AGE_DAYS * 24 * 60 * 60 * 1000;

  if (!Number.isFinite(verifiedAt.getTime()) || verificationAge < 0 || verificationAge > maxAge) {
    return null;
  }

  return url.href;
}
