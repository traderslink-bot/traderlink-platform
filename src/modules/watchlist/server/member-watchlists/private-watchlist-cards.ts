import { z } from "zod";

// Strip arbitrary provider metadata. Never pass raw provider objects to the UI.
const time = z.number().int().nonnegative().max(8_640_000_000_000_000);
const price = z.number().finite().nonnegative();
const side = z.enum(["support", "resistance"]);
const timeframes = z.array(z.enum(["daily", "4h", "5m"]));
const level = z.object({ side, price, distancePct: z.number().finite(), label: z.string(),
  lowPrice: price.optional(), highPrice: price.optional(), lowDistancePct: z.number().finite().optional(), highDistancePct: z.number().finite().optional(),
  strengthLabel: z.enum(["weak", "moderate", "strong", "major"]).optional(), freshness: z.enum(["fresh", "aging", "stale"]).optional(),
  sourceLabel: z.string().nullable().optional(), marketDataProvenance: z.object({ formedAt: time, sourceLastSeenAt: time, lastTestedAt: time.optional(), lastConfirmedAt: time.optional() }).optional(),
  evidenceCount: z.number().int().nonnegative().optional(), firstEvidenceAt: time.optional(), lastEvidenceAt: time.optional(), timeframes: timeframes.optional(),
  isClustered: z.boolean().optional(), evidenceStatus: z.enum(["detected_structure", "historically_tested", "synthetic_planning"]).optional(),
  roleFlipFromSide: side.nullable().optional(), roleFlipState: z.enum(["original", "testing", "confirmed"]).optional() });
export const privateLevelMap = z.object({ currentPrice: price, rangeState: z.enum(["tight", "normal", "wide"]),
  nearestSupport: level.nullable(), nearestResistance: level.nullable(), nextStrongSupport: level.nullable(), nextStrongResistance: level.nullable(),
  supportLevels: z.array(level), resistanceLevels: z.array(level), roleFlipConfirmationPct: z.number().finite().nonnegative().optional(),
  dataQuality: z.object({ status: z.enum(["full", "limited", "unavailable"]), availableTimeframes: timeframes, flags: z.array(z.string()), message: z.string().optional() }).optional(),
  referenceLevels: z.array(z.object({ key: z.enum(["pmh", "pml", "orh", "orl", "hod", "lod", "pdh", "pdl", "pdc", "vwap"]), label: z.string(), price, kind: z.enum(["session", "dynamic"]) })).optional() });
export const privateTextCard = z.object({ title: z.string(), body: z.string(), updatedAt: time,
  priceWhenPosted: z.number().finite().nonnegative().nullable(), source: z.string() });
export const privateLevelsCard = z.object({ symbol: z.string().regex(/^[A-Z][A-Z0-9.-]{0,9}$/),
  referencePrice: z.number().finite().positive(), referencePriceAsOf: time, calculatedAt: time,
  levelMap: privateLevelMap.optional(),
  fullLadderCard: privateTextCard.nullable(), nearestSupportResistanceCard: privateTextCard.nullable() });
export const privateCards = z.object({ analysis: privateTextCard.optional(), indicators: privateTextCard.optional(), levels: privateLevelsCard.optional() }).strict();
export type PrivateWatchlistCards = z.infer<typeof privateCards>;
