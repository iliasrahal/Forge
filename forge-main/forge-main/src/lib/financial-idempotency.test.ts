import assert from "node:assert/strict";
import test from "node:test";
import { getFinancialCreationKey } from "./financial-idempotency";

test("scope une clé d'idempotence au workspace et au document", () => {
  const request = new Request("https://forge.test", { headers: { "Idempotency-Key": "retry-123456" } });
  assert.equal(getFinancialCreationKey(request, "deposit:workspace-a"), "deposit:workspace-a:retry-123456");
  assert.equal(getFinancialCreationKey(new Request("https://forge.test"), "deposit:workspace-a"), null);
});
