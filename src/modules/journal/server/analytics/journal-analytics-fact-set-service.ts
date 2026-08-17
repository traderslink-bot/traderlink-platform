import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type {
  JournalAnalyticsFactSet,
  JournalAnalyticsFactSetRequest,
} from "../../contracts/journal-analytics-fact-set";
import { JournalAnalyticsFactSetRepository } from "./journal-analytics-fact-set-repository";

export interface JournalAnalyticsFactSetReader {
  getJournalAnalyticsFactSet(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet;
}

export class JournalAnalyticsFactSetService implements JournalAnalyticsFactSetReader {
  constructor(private readonly repository: JournalAnalyticsFactSetRepository) {}

  getJournalAnalyticsFactSet(
    scope: WorkspaceAccessScope,
    request: JournalAnalyticsFactSetRequest,
  ): JournalAnalyticsFactSet {
    return this.repository.read(scope, request);
  }
}
