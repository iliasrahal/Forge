import assert from "node:assert/strict";
import test from "node:test";

import { getWorkspacePermissions } from "./workspace-permissions";

test("READ_ONLY conserve la lecture et interdit toutes les écritures", () => {
  assert.deepEqual(getWorkspacePermissions("READ_ONLY", true), {
    canRead: true,
    canWrite: false,
    canUseForge: false,
    canManageTeam: false,
  });
});

test("un abonnement ne permet jamais à READ_ONLY de contourner son rôle", () => {
  assert.equal(
    getWorkspacePermissions("READ_ONLY", true).canWrite,
    false,
  );
  assert.equal(
    getWorkspacePermissions("READ_ONLY", true).canUseForge,
    false,
  );
});

test("OWNER et ADMIN conservent leurs capacités avec un accès actif", () => {
  assert.equal(getWorkspacePermissions("OWNER", true).canManageTeam, true);
  assert.equal(getWorkspacePermissions("ADMIN", true).canWrite, true);
  assert.equal(getWorkspacePermissions("ADMIN", true).canManageTeam, false);
});
