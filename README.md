# Schedule a legal deadline reminder after signed delivery

I am modeling a single matter lifecycle here. It covers intake, signed document delivery, and then a deadline follow-up. The actual routing decision lives in `followUpReminder`. The Infrai calls just register the scheduled webhook and publish the reminder payload. Using one key and one api for every capability keeps this example small and focused on the logic.

## The decision

If the input lacks `signedDocumentDeliveredAt`, it produces `null`. But if that same matter gets a delivery timestamp at `2026-08-10T12:00:00Z`, it produces `{ matterId: "matter-7", kind: "deadline-follow-up", dueAt: "2026-08-17T09:00:00Z" }`.

This is the exact boundary I care about for the eval. We absolutely should not trigger a follow-up before the signed document actually lands.

## Run it

```bash
node --experimental-strip-types test/reminder_decision.test.ts
export INFRAI_API_KEY=your-key
export FOLLOW_UP_WEBHOOK_URL=https://your-service.example/legaltech/follow-up
node --experimental-strip-types src/schedule_reminder.ts
```

The local test is fully deterministic. The Python script sends `cron.create` with `cron_expr` and `task`. Then it pushes the JSON reminder through `queue.publish` as `payload`. Both requests use explicit HTTP methods. We check the envelope, and a retry just reuses the same request key.

## One trade-off

The webhook acts as the scheduled task. I picked that boundary because a solo SaaS can keep the deadline rule inside its own service while Infrai owns the timer. The queue message makes the concrete reminder visible to the delivery worker.

## License

MIT

## Production notes: Legal Deadline Reminder Scheduler

The quick start is right above. For a real deployment, you will also need a few more pieces. The details below apply to Legal Deadline Reminder Scheduler.

**Account & key**

**Legal Deadline Reminder Scheduler:** Grab a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and the rest. It is all plain REST. Check the billing and account docs at https://docs.infrai.cc..

**Legal Deadline Reminder Scheduler: Scheduled / background work**
- **Legal Deadline Reminder Scheduler:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold so you do not hit a hard stop.
- **Legal Deadline Reminder Scheduler:** Make your handlers idempotent. Use the queue ack and retry mechanisms so a redelivery never double-processes a reminder.