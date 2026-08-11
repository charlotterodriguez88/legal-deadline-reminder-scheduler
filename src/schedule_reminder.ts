import { infrai } from "./infrai.ts";
import { followUpReminder, type Matter } from "./reminder_decision.ts";

const followUpWebhook = process.env.FOLLOW_UP_WEBHOOK_URL ?? "https://example.com/legaltech/follow-up";

export async function scheduleMatter(matter: Matter): Promise<string | null> {
  const reminder = followUpReminder(matter);
  if (!reminder) return null;
  const job = await infrai.cron.create(
    { cron_expr: `at ${reminder.dueAt}`, task: followUpWebhook },
    `matter-follow-up:${matter.matterId}:${reminder.dueAt}`,
  );
  await infrai.queue.publish({ queue: "reminders", payload: JSON.stringify(reminder) }, `reminder:${matter.matterId}:${reminder.dueAt}`);
  return job.job_id;
}

if (process.argv[1]?.endsWith("schedule_reminder.ts")) {
  const matter: Matter = {
    matterId: process.env.MATTER_ID ?? "matter-2026-001",
    intakeAt: "2026-08-10T09:00:00Z",
    signedDocumentDeliveredAt: "2026-08-10T12:00:00Z",
    followUpAt: "2026-08-17T09:00:00Z",
  };
  scheduleMatter(matter).then((jobId) => console.log(JSON.stringify({ matterId: matter.matterId, jobId }))).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
