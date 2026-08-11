export type Matter = {
  matterId: string;
  intakeAt: string;
  signedDocumentDeliveredAt?: string;
  followUpAt: string;
};

export type Reminder = { matterId: string; kind: "deadline-follow-up"; dueAt: string };

export function followUpReminder(matter: Matter): Reminder | null {
  if (!matter.signedDocumentDeliveredAt) return null;
  return { matterId: matter.matterId, kind: "deadline-follow-up", dueAt: matter.followUpAt };
}
