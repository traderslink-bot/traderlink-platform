import { previewIbkrActivityStatement } from "./ibkr-activity-statement-adapter";
import { syntheticIbkrStatement } from "./synthetic-ibkr-fixtures";

describe("IBKR Activity Statement adapter", () => {
  it("returns a blocking IBKR preview for an unrelated flat broker CSV instead of throwing", () => {
    const sourceBytes = Buffer.from([
      "Trade Date,Fill Time,Ticker,Action,Shares,Fill Price,Commission,Currency,Fill ID",
      "2026-08-02,09:31:00,GENR,BUY,2.3456,10.123456,0.123456,USD,G1",
      "2026-08-02,10:02:00,GENR,SELL,2.3456,10.654321,0.234567,USD,G2",
      "",
    ].join("\r\n"), "utf8");
    const preview = previewIbkrActivityStatement({
      sourceBytes,
      sourceTimezone: "America/New_York",
    });
    expect(preview.rawSourceAccountId).toBeNull();
    expect(preview.rows).toHaveLength(3);
    expect(preview.executions).toEqual([]);
    expect(preview.issues.map((issue) => issue.issueCode)).toEqual(
      expect.arrayContaining([
        "source_account_identity_missing",
        "statement_period_missing",
      ]),
    );
  });

  it("preserves every record and maps only supported stock executions", () => {
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(syntheticIbkrStatement, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rows).toHaveLength(12);
    expect(preview.executions).toHaveLength(2);
    expect(preview.executions.map((entry) => [entry.side, entry.quantityDecimal, entry.priceDecimal])).toEqual([
      ["buy", "100", "10"],
      ["sell", "100", "10.5"],
    ]);
    expect(preview.executions[0].executedAtUtc).toBe("2026-01-05T14:30:00.000Z");
    expect(preview.rows[7].classification).toBe("unsupported");
    expect(preview.issues).toContainEqual(expect.objectContaining({ issueCode: "equity_journal_not_enabled", isBlocking: false }));
    expect(preview.coverageIntervals).toEqual(expect.arrayContaining([
      expect.objectContaining({ assetClass: "stock", coverageKind: "complete" }),
      expect.objectContaining({ assetClass: "forex", coverageKind: "complete" }),
    ]));
    expect(preview.positionFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ normalizedSymbol: "ALPHA", factKind: "opening_balance", quantityDecimal: "0" }),
      expect.objectContaining({ normalizedSymbol: "ALPHA", factKind: "closing_balance", quantityDecimal: "0" }),
      expect.objectContaining({ normalizedSymbol: "BETA", factKind: "open_position", quantityDecimal: "25" }),
    ]));
  });

  it("keeps repeated identical records as separate occurrence evidence", () => {
    const repeated = `${syntheticIbkrStatement}\r\n${syntheticIbkrStatement.split("\r\n")[5]}\r\n`;
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(repeated, "utf8"),
      sourceTimezone: "America/New_York",
    });
    const duplicateRows = preview.rows.filter((row) => row.rawFieldsJson === preview.rows[5].rawFieldsJson);
    expect(duplicateRows.map((row) => row.occurrenceOrdinal)).toEqual([1, 2]);
    const duplicateExecutions = preview.executions.filter((entry) => entry.normalizedContentIdentity === preview.executions[0].normalizedContentIdentity);
    expect(duplicateExecutions.map((entry) => entry.contentOccurrenceOrdinal)).toEqual([1, 2]);
  });

  it("defers same-time opposite-side ordering to the full-chain rebuild", () => {
    const csvText = syntheticIbkrStatement.replace(
      'Trades,Data,Order,Stocks,USD,ALPHA,"2026-01-05, 10:30:00",-100,10.5,,SYNTH-FILL-2',
      'Trades,Data,Order,Stocks,USD,ALPHA,"2026-01-05, 09:30:00",-100,10.5,,SYNTH-FILL-2',
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.executions.map((execution) => execution.factCompleteness))
      .toEqual(["complete", "complete"]);
    expect(preview.issues.filter((candidate) =>
      candidate.issueCode === "execution_order_ambiguous")).toHaveLength(0);
  });

  it("classifies an unmappable position row as needing correction", () => {
    const csvText = syntheticIbkrStatement.replace(
      "Mark-to-Market Performance Summary,Data,Stocks,USD,ALPHA,0,0",
      "Mark-to-Market Performance Summary,Data,Stocks,USD,ALPHA,invalid,also-invalid",
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rows[9].classification).toBe("needs_correction");
    expect(preview.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        issueCode: "position_fact_opening_balance_quantity_invalid",
        chainHint: expect.objectContaining({
          normalizedSymbol: "ALPHA",
          tradeCurrency: "USD",
          effectiveAtUtc: "2026-01-01T05:00:00.000Z",
        }),
      }),
      expect.objectContaining({
        issueCode: "position_fact_closing_balance_quantity_invalid",
        chainHint: expect.objectContaining({
          normalizedSymbol: "ALPHA",
          tradeCurrency: "USD",
          effectiveAtUtc: "2026-02-01T04:59:59.000Z",
        }),
      }),
    ]));
  });

  it("rejects an invalid human-readable statement date instead of normalizing it", () => {
    const csvText = syntheticIbkrStatement.replace(
      "January 1, 2026 - January 31, 2026",
      "February 1, 2026 - February 30, 2026",
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.statementPeriodStartDate).toBeNull();
    expect(preview.statementPeriodEndDate).toBeNull();
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "statement_period_missing",
    }));
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "position_fact_opening_balance_period_unresolved",
      issueScope: "position_fact",
    }));
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "position_fact_closing_balance_period_unresolved",
      issueScope: "position_fact",
    }));
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "position_fact_open_position_period_unresolved",
      issueScope: "position_fact",
    }));
    expect(preview.rows[9].classification).toBe("needs_correction");
  });

  it("blocks a data row whose field count does not match its section header", () => {
    const csvText = syntheticIbkrStatement.replace(
      ",SYNTH-FILL-1",
      ",SYNTH-FILL-1,UNEXPECTED",
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rows[5].classification).toBe("needs_correction");
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "source_record_field_count_mismatch",
      isBlocking: true,
    }));
  });

  it("accepts IBKR Codes legend rows that omit the unused second code pair", () => {
    const csvText = `${syntheticIbkrStatement}\r\n` +
      "Codes,Header,Code,Meaning,Code (Cont.),Meaning (Cont.)\r\n" +
      "Codes,Data,A,Assignment";
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rows.at(-1)?.classification).toBe("automatic_non_execution");
    expect(preview.issues).not.toContainEqual(expect.objectContaining({
      recordOrdinal: preview.rows.length,
      issueCode: "source_record_field_count_mismatch",
    }));

    const malformed = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText.replace(
        "Codes,Data,A,Assignment",
        "Codes,Data,A",
      ), "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(malformed.rows.at(-1)?.classification).toBe("needs_correction");
    expect(malformed.issues).toContainEqual(expect.objectContaining({
      recordOrdinal: malformed.rows.length,
      issueCode: "source_record_field_count_mismatch",
      isBlocking: true,
    }));
  });

  it("does not map position facts from a structurally invalid row", () => {
    const csvText = syntheticIbkrStatement.replace(
      "Mark-to-Market Performance Summary,Data,Stocks,USD,ALPHA,0,0",
      "Mark-to-Market Performance Summary,Data,Stocks,USD,ALPHA,0,0,UNEXPECTED",
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rows[9].classification).toBe("needs_correction");
    expect(preview.positionFacts.some((fact) => fact.normalizedSymbol === "ALPHA"))
      .toBe(false);
  });

  it("decision-gates a repeated daylight-saving local execution time", () => {
    const csvText = syntheticIbkrStatement.replace(
      '"2026-01-05, 09:30:00"',
      '"2026-11-01, 01:30:00"',
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.executions).toHaveLength(1);
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "execution_time_ambiguous",
      issueScope: "execution",
    }));
  });

  it("rejects control characters inside a mapped stock symbol", () => {
    const csvText = syntheticIbkrStatement.replace(
      ",USD,ALPHA,",
      ',USD,"AL\nPHA",',
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.executions).toHaveLength(1);
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "execution_fact_invalid",
    }));
  });

  it("blocks conflicting source accounts instead of selecting the last row", () => {
    const csvText = `${syntheticIbkrStatement}\r\nAccount Information,Data,Account,OTHER-ACCOUNT\r\n`;
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rawSourceAccountId).toBeNull();
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "source_account_identity_conflict",
      isBlocking: true,
    }));
  });

  it("keeps an invalid source-account value bound to its evidence row", () => {
    const invalidAccount = "X".repeat(257);
    const csvText = syntheticIbkrStatement.replace(
      "Account Information,Data,Account,SYNTH-ACCOUNT",
      `Account Information,Data,Account,${invalidAccount}`,
    );
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.rawSourceAccountId).toBeNull();
    expect(preview.issues).toContainEqual(expect.objectContaining({
      recordOrdinal: 4,
      issueCode: "source_account_identity_invalid",
      issueScope: "row",
      isBlocking: true,
    }));
  });

  it("contains conflicting statement periods without choosing one", () => {
    const csvText = `${syntheticIbkrStatement}\r\nStatement,Data,Period,"February 1, 2026 - February 28, 2026"\r\n`;
    const preview = previewIbkrActivityStatement({
      sourceBytes: Buffer.from(csvText, "utf8"),
      sourceTimezone: "America/New_York",
    });
    expect(preview.statementPeriodStartDate).toBeNull();
    expect(preview.statementPeriodEndDate).toBeNull();
    expect(preview.issues).toContainEqual(expect.objectContaining({
      issueCode: "statement_period_conflict",
      isBlocking: false,
    }));
  });
});
