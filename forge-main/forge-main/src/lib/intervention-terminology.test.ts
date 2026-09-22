import assert from "node:assert/strict";
import test from "node:test";

import { getInterventionTerminology } from "./intervention-terminology";

test("emploie intervention pour une seule journée", () => {
  const terminology = getInterventionTerminology({
    startDateKey: "2026-09-18",
    endDateKey: "2026-09-18",
  });

  assert.equal(terminology.isMultiDay, false);
  assert.equal(terminology.startAction, "Commencer l’intervention");
  assert.equal(terminology.trackingTitle, "Suivi de l’intervention");
});

test("emploie chantier dès que plusieurs journées sont couvertes", () => {
  const terminology = getInterventionTerminology({
    startDateKey: "2026-09-18",
    endDateKey: "2026-09-20",
  });

  assert.equal(terminology.isMultiDay, true);
  assert.equal(terminology.deleteAction, "Supprimer le chantier");
});

test("reconnaît un planning multi-jours même sans date de fin explicite", () => {
  const terminology = getInterventionTerminology({
    startDateKey: "2026-09-18",
    plannedDateKeys: ["2026-09-18", "2026-09-19"],
  });

  assert.equal(terminology.isMultiDay, true);
});
