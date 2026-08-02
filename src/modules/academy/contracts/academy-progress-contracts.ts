export type AcademyProgressSourceKind =
  | "local_development"
  | "public_auth"
  | "legacy_import";

export type AcademyProgressActor = Readonly<{
  userId: string;
  sourceKind: AcademyProgressSourceKind;
}>;

export type AcademyLessonProgressMutation = Readonly<{
  contractVersion: "traderlink_academy_progress_v1";
  lessonSlug: string;
  completed: boolean;
  changed: boolean;
}>;
