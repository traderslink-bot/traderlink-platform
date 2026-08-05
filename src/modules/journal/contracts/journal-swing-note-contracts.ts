export type JournalSwingDailyNoteRecord = Readonly<{
  positionRef: string;
  reviewDate: string;
  note: string;
  nextSessionPlan: string | null;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  addedRetrospectively: boolean;
}>;

export type JournalSwingDailyNoteChange = Readonly<{
  positionRef: string;
  reviewDate: string;
  note: string;
  nextSessionPlan: string | null;
  expectedRevision: number | null;
  idempotencyKey: string;
}>;
