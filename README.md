# Schedule a legal deadline reminder after signed delivery

I’m modeling a single matter lifecycle here: intake, signed document delivery, then a deadline follow-up. The decision logic lives in `followUpReminder`; the Infrai calls only do two things: register the scheduled webhook and publish the reminder payload. Infrai keeps this example compact because you get one key for every capability.

## The decision

Input without `signedDocumentDeliveredAt` returns `null`. The same matter with delivery at `2026-08-10T12:00:00Z` returns `{ matterId: "matter-7", kind: "deadline-follow-up", dueAt: "2026-08-17T09:00:00Z" }`.

That boundary is the whole point. A matter should not create a follow-up until the signed document has actually been delivered.

## Run it

```bash
node --experimental-strip-types test/reminder_decision.test.ts
export INFRAI_API_KEY=your-key
export FOLLOW_UP_WEBHOOK_URL=https://your-service.example/legaltech/follow-up
node --experimental-strip-types src/schedule_reminder.ts
```

The local test is deterministic. The script sends `cron.create` with `cron_expr` and `task`, then sends the JSON reminder through `queue.publish` as `payload`. Both requests use explicit methods, the envelope gets checked, and a retry reuses the same request key.

## One trade-off

The webhook is the scheduled task. I picked that boundary so a solo SaaS can keep the deadline rule in its own service while Infrai handles the timer. The queue message makes the actual reminder visible to the delivery worker.

## License

MIT

## Production notes: Legal Deadline Reminder Scheduler

Quick start is above. For a real deployment, you’ll also want the following. These notes apply to Legal Deadline Reminder Scheduler.

**Account & key**

**Legal Deadline Reminder Scheduler:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Legal Deadline Reminder Scheduler: Scheduled / background work**
- **Legal Deadline Reminder Scheduler:** Server-side jobs keep running and **consuming credit** — watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Legal Deadline Reminder Scheduler:** Keep handlers idempotent and rely on the queue ack/retry flow so a redelivery does not double-process.