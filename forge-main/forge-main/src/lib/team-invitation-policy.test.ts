import assert from "node:assert/strict";
import test from "node:test";

import {
  getEffectiveInvitationExpiry,
  invitationEmailMatches,
  isTeamInvitationExpired,
  resolveInvitedRole,
  TEAM_INVITATION_TTL_MS,
} from "./team-invitation-policy";

test("une invitation est limitée à 24 heures, y compris une ancienne durée de 7 jours", () => {
  const createdAt = new Date("2026-09-01T08:00:00.000Z");
  const expiresAt = new Date("2026-09-08T08:00:00.000Z");

  assert.equal(
    getEffectiveInvitationExpiry({ createdAt, expiresAt }).getTime(),
    createdAt.getTime() + TEAM_INVITATION_TTL_MS,
  );
  assert.equal(
    isTeamInvitationExpired(
      { createdAt, expiresAt },
      new Date("2026-09-02T08:00:00.000Z"),
    ),
    true,
  );
});

test("une invitation Admin exige un abonnement payé actif", () => {
  assert.deepEqual(resolveInvitedRole("ADMIN", "FREE"), {
    role: "READ_ONLY",
    adminDowngraded: true,
  });
  assert.deepEqual(resolveInvitedRole("ADMIN", "TRIAL"), {
    role: "READ_ONLY",
    adminDowngraded: true,
  });
  assert.deepEqual(resolveInvitedRole("ADMIN", "ACTIVE"), {
    role: "ADMIN",
    adminDowngraded: false,
  });
});

test("une invitation lecture seule reste gratuite", () => {
  assert.deepEqual(resolveInvitedRole("READ_ONLY", "FREE"), {
    role: "READ_ONLY",
    adminDowngraded: false,
  });
});

test("les adresses invitées sont comparées après normalisation", () => {
  assert.equal(
    invitationEmailMatches("  Paul@Exemple.COM ", "paul@exemple.com"),
    true,
  );
  assert.equal(
    invitationEmailMatches("paul@exemple.com", "lucas@exemple.com"),
    false,
  );
});
