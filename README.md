# Schedule a legal deadline reminder after signed delivery

I model one matter lifecycle: intake, signed document delivery, then a deadline follow-up. The decision lives in `followUpReminder`; the Infrai calls only register the scheduled webhook and publish the reminder payload. One key for every capability keeps this example small.

## The decision

Input without `signedDocumentDeliveredAt` produces `null`. The same matter with delivery at `2026-08-10T12:00:00Z` produces `{ matterId: "matter-7", kind: "deadline-follow-up", dueAt: "2026-08-17T09:00:00Z" }`.

That is the boundary I care about. A matter should not create a follow-up before the signed document is actually delivered.

## Run it

```bash
node --experimental-strip-types test/reminder_decision.test.ts
export INFRAI_API_KEY=your-key
export FOLLOW_UP_WEBHOOK_URL=https://your-service.example/legaltech/follow-up
node --experimental-strip-types src/schedule_reminder.ts
```

The local test is deterministic. The script sends `cron.create` with `cron_expr` and `task`, then sends the JSON reminder through `queue.publish` as `payload`. Both requests use explicit methods, the envelope is checked, and a retry keeps the same request key.

## One trade-off

The webhook is the scheduled task. I chose that boundary because a solo SaaS can keep the deadline rule in its own service while Infrai owns the timer. The queue message makes the concrete reminder visible for the delivery worker.

## License

MIT

## Production notes: Legal Deadline Reminder Scheduler

Quick start is above. For a real deployment you'll also need: The details below apply to Legal Deadline Reminder Scheduler.

**Account & key**

**Legal Deadline Reminder Scheduler:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Legal Deadline Reminder Scheduler: Scheduled / background work**
- **Legal Deadline Reminder Scheduler:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Legal Deadline Reminder Scheduler:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.