import {
  buildProductTraderAnalyticsViewModel,
  buildSampleSavedTraderAnalyticsData,
} from "../index";
import {
  DEMO_USER_ID,
  SqliteImportCommitRepository,
} from "../product/import-commit/sqlite-import-commit-repository";
import { filterCustomerSavedReports } from "../product/customer-data-filter";

export function getSavedTraderAnalyticsRepository(): SqliteImportCommitRepository {
  return new SqliteImportCommitRepository();
}

export function buildSavedOrSampleTraderAnalyticsViewModel(options?: {
  preferSample?: boolean;
}) {
  const repository = getSavedTraderAnalyticsRepository();
  const reports = filterCustomerSavedReports(repository.listReports(DEMO_USER_ID));

  if (reports.length > 0 && !options?.preferSample) {
    return {
      mode: "saved" as const,
      repository,
      userId: DEMO_USER_ID,
      importRequests: [],
      viewModel: buildProductTraderAnalyticsViewModel({
        repository,
        userId: DEMO_USER_ID,
        importRequests: [],
        storageMode: "local_sqlite_single_user",
      }),
    };
  }

  const sample = buildSampleSavedTraderAnalyticsData();

  return {
    mode: "sample" as const,
    repository: sample.repository,
    userId: sample.userId,
    importRequests: sample.importRequests,
    viewModel: buildProductTraderAnalyticsViewModel({
      repository: sample.repository,
      userId: sample.userId,
      importRequests: sample.importRequests,
      storageMode: "sample_in_memory",
    }),
  };
}
