import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "../modules/platform/server/authentication/local-development-configuration";
import { withPlatformDatabase } from "../modules/platform/server/database/open-platform-database";
import { deriveDevelopmentOwnerJournalScope } from "../modules/journal/server/accounts/journal-development-owner-scope";
import {
  JournalAccountService,
  loadAccountIdentityConfiguration,
} from "../modules/journal/server/accounts/journal-account-service";
import { JournalAccountRepository } from "../modules/journal/server/accounts/journal-account-repository";
import {
  ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
  DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
} from "../modules/journal/server/accounts/journal-source-account-canonicalizers";
import { JournalDataDecisionRepository } from "../modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "../modules/journal/server/decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "../modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "../modules/journal/server/executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
  loadJournalPrivacyHmacConfiguration,
} from "../modules/journal/server/imports/journal-import-service";
import { JournalImportRepository } from "../modules/journal/server/imports/journal-import-repository";
import { JournalIntegrityCommandService } from "../modules/journal/server/journal-integrity-command-service";
import { JournalExecutionReconciliationRepository } from "../modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "../modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../modules/journal/server/round-trips/journal-round-trip-service";

type Trade = Readonly<{
  symbol: string;
  timestamp: string;
  quantity: string;
  price: string;
  id: string;
}>;

type Position = Readonly<{
  symbol: string;
  prior: string;
  current: string;
}>;

type OpenPosition = Readonly<{
  symbol: string;
  quantity: string;
}>;

function statement(input: Readonly<{
  period: string;
  trades: readonly Trade[];
  positions: readonly Position[];
  openPositions?: readonly OpenPosition[];
}>): string {
  return [
    "Statement,Header,Field Name,Field Value",
    `Statement,Data,Period,"${input.period}"`,
    "Account Information,Header,Field Name,Field Value",
    "Account Information,Data,Account,DATA-DECISION-REVIEW-EXAMPLES",
    "Trades,Header,DataDiscriminator,Asset Category,Currency,Symbol,Date/Time,Quantity,T. Price,Comm/Fee,TradeID",
    ...input.trades.map((trade) =>
      `Trades,Data,Order,Stocks,USD,${trade.symbol},"${trade.timestamp}",${trade.quantity},${trade.price},,${trade.id}`),
    "Mark-to-Market Performance Summary,Header,Asset Category,Currency,Symbol,Prior Quantity,Current Quantity",
    ...input.positions.map((position) =>
      `Mark-to-Market Performance Summary,Data,Stocks,USD,${position.symbol},${position.prior},${position.current}`),
    ...(input.openPositions?.length
      ? [
          "Open Positions,Header,DataDiscriminator,Asset Category,Currency,Symbol,Quantity",
          ...input.openPositions.map((position) =>
            `Open Positions,Data,Summary,Stocks,USD,${position.symbol},${position.quantity}`),
        ]
      : []),
  ].join("\r\n");
}

const examples = Object.freeze([
  Object.freeze({
    label: "Open trade review",
    statement: statement({
      period: "February 1, 2026 - February 28, 2026",
      trades: [
        {
          symbol: "TLDEMOOPEN",
          timestamp: "2026-02-10, 10:15:00",
          quantity: "25",
          price: "4.00",
          id: "TL-OPEN-001",
        },
      ],
      positions: [
        { symbol: "TLDEMOOPEN", prior: "0", current: "25" },
        { symbol: "TLDEMOOPEN", prior: "0", current: "0" },
      ],
      openPositions: [{ symbol: "TLDEMOOPEN", quantity: "25" }],
    }),
  }),
  Object.freeze({
    label: "Missing execution price",
    statement: statement({
      period: "March 1, 2026 - March 31, 2026",
      trades: [
        {
          symbol: "TLDEMOPRICE",
          timestamp: "2026-03-03, 09:45:00",
          quantity: "10",
          price: "",
          id: "TL-PRICE-001",
        },
        {
          symbol: "TLDEMOPRICE",
          timestamp: "2026-03-03, 10:15:00",
          quantity: "-10",
          price: "5.50",
          id: "TL-PRICE-002",
        },
      ],
      positions: [{ symbol: "TLDEMOPRICE", prior: "0", current: "0" }],
    }),
  }),
  Object.freeze({
    label: "Same-time order review",
    statement: statement({
      period: "April 1, 2026 - April 30, 2026",
      trades: [
        {
          symbol: "TLDEMOORDER",
          timestamp: "2026-04-08, 09:30:00",
          quantity: "10",
          price: "6.00",
          id: "TL-ORDER-001",
        },
        {
          symbol: "TLDEMOORDER",
          timestamp: "2026-04-08, 09:30:00",
          quantity: "-10",
          price: "6.40",
          id: "TL-ORDER-002",
        },
      ],
      positions: [{ symbol: "TLDEMOORDER", prior: "0", current: "0" }],
    }),
  }),
  Object.freeze({
    label: "Imported row needs repair",
    statement: statement({
      period: "May 1, 2026 - May 31, 2026",
      trades: [
        {
          symbol: "TLDEMOROW",
          timestamp: "2026-05-12, 10:00:00",
          quantity: "8",
          price: "3.25",
          id: "TL-ROW-001",
        },
        {
          symbol: "TLDEMOROW",
          timestamp: "2026-05-12, 10:05:00",
          quantity: "0",
          price: "3.30",
          id: "TL-ROW-002",
        },
      ],
      positions: [{ symbol: "TLDEMOROW", prior: "0", current: "8" }],
      openPositions: [{ symbol: "TLDEMOROW", quantity: "8" }],
    }),
  }),
] as const);

loadTraderLinkPlatformLocalDevelopmentConfiguration({
  repositoryRoot: process.cwd(),
});

const result = withPlatformDatabase({ mode: "runtime" }, (database) => {
  const owner = deriveDevelopmentOwnerJournalScope(database);
  const scope = owner.scope;
  if (!scope.activeAccountId || scope.allowedAccountIds.length !== 1) {
    throw new Error("review_examples_require_one_active_journal_account");
  }
  const accountRepository = new JournalAccountRepository(database);
  const accounts = new JournalAccountService(
    accountRepository,
    loadAccountIdentityConfiguration(
      process.env,
      ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,
      DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    ),
  );
  const importRepository = new JournalImportRepository(database);
  const executionRepository = new JournalExecutionRepository(database);
  const reconciliation = new JournalExecutionReconciliationRepository(database);
  const imports = new JournalImportService(
    importRepository,
    executionRepository,
    accounts,
    createJournalPrivacyDigester(loadJournalPrivacyHmacConfiguration()),
    reconciliation,
  );
  const roundTrips = new JournalRoundTripService(
    new JournalRoundTripRepository(database),
  );
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importRepository,
    imports,
    executionRepository,
    new JournalExecutionService(executionRepository),
    roundTrips,
    reconciliation,
  );
  const command = new JournalIntegrityCommandService(
    importRepository,
    imports,
    decisions,
    roundTrips,
  );
  return examples.map((example, index) => {
    const sourceBytes = Buffer.from(example.statement, "utf8");
    const preview = imports.previewIbkr(sourceBytes, "America/New_York");
    const committed = command.commitIbkrStatement(scope, {
      sourceBytes,
      sourceTimezone: "America/New_York",
      privacySafeAccountDisplay: "Data Decisions Review Examples",
      sourceDisplayLabel: `Data Decisions review example: ${example.label}`,
      evidenceObjectKey: `ibkr/${preview.sourceFileSha256}.csv`,
      confirmedSourceIdentityAccountId: scope.activeAccountId,
      now: new Date(`2026-08-04T${String(16 + index).padStart(2, "0")}:00:00.000Z`),
    });
    return Object.freeze({
      label: example.label,
      status: committed.status,
      createdExecutionCount: committed.createdExecutionCount,
      pendingDecisionCount: committed.relatedDecisionIds.length,
    });
  });
});

console.info(JSON.stringify({ reviewExamples: result }));
