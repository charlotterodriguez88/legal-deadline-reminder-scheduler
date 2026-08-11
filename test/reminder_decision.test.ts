import assert from "node:assert/strict";
import { followUpReminder } from "../src/reminder_decision.ts";

const matter = { matterId: "matter-7", intakeAt: "2026-08-10T09:00:00Z", followUpAt: "2026-08-17T09:00:00Z" };
assert.equal(followUpReminder(matter), null);
assert.deepEqual(followUpReminder({ ...matter, signedDocumentDeliveredAt: "2026-08-10T12:00:00Z" }), {
  matterId: "matter-7", kind: "deadline-follow-up", dueAt: "2026-08-17T09:00:00Z",
});
console.log("reminder decision: passed");
