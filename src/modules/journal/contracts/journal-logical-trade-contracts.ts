export type JournalLogicalTradeStyle = "day" | "swing";

export type JournalLogicalTradeMember = Readonly<{
  roundTripId: string;
  roundTripVersionId: string;
  sequence: number;
  openedAtUtc: string;
  closedAtUtc: string;
}>;

export type JournalLogicalTrade = Readonly<{
  logicalTradeId: string | null;
  revision: number;
  lifecycleState: "active" | "review_required";
  tradeStyle: JournalLogicalTradeStyle;
  instrumentId: string;
  symbol: string;
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  members: readonly JournalLogicalTradeMember[];
}>;

export type JournalLogicalTradeCandidate = JournalLogicalTrade & Readonly<{
  sameMarketDate: boolean;
}>;

export type JournalLogicalTradeMergePreview = Readonly<{
  current: JournalLogicalTrade;
  sameDay: readonly JournalLogicalTradeCandidate[];
  otherDates: readonly JournalLogicalTradeCandidate[];
}>;

export type JournalLogicalTradeMergeCandidateView = Readonly<{
  candidateRef: string;
  symbol: string;
  tradeStyle: JournalLogicalTradeStyle;
  openedAtUtc: string;
  closedAtUtc: string;
  memberCount: number;
}>;

export type JournalLogicalTradeMergeView = Readonly<{
  revision: number;
  isMerged: boolean;
  current: JournalLogicalTradeMergeCandidateView;
  sameDay: readonly JournalLogicalTradeMergeCandidateView[];
  otherDates: readonly JournalLogicalTradeMergeCandidateView[];
}>;

export type JournalLogicalTradeMergeCommand = Readonly<{
  expectedCurrentRevision: number;
  logicalTradeIds: readonly string[];
  fallbackRoundTripIds: readonly string[];
  tradeStyle: JournalLogicalTradeStyle;
}>;

export type JournalLogicalTradeMergeSelection = Readonly<{
  expectedCurrentRevision: number;
  candidateRefs: readonly string[];
  tradeStyle: JournalLogicalTradeStyle;
}>;
