import { Buffer } from "node:buffer";

import type {
  CoachAiChatFactualToolCallSnapshot,
} from "../contracts/ai-chat-contracts";
import {
  CoachAiChatFactualToolError,
  type CoachAiChatFactualToolRequest,
  type CoachAiChatFactualToolResponse,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import type { CoachAiChatFactualToolService } from "./coach-ai-chat-factual-tool-service";
import type { CoachAiChatTradeDetailService } from "./coach-ai-chat-trade-detail-service";

/** A generation has one shared factual-result budget. Results are never shortened to fit it. */
/** Across at most two tool steps; later model calls can receive this package twice. */
export const COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES = 72 * 1024;

function unsupportedTool(request: never): never {
  void request;
  throw new CoachAiChatFactualToolError("invalid_request");
}

export class CoachAiChatFactualToolDispatcher {
  private readonly snapshots: CoachAiChatFactualToolCallSnapshot[] = [];
  private totalBytes = 0;

  constructor(
    private readonly tools: Pick<CoachAiChatFactualToolService,
      "summarizeClosedTrades" | "groupClosedTrades" | "listClosedTrades">,
    private readonly details: Pick<CoachAiChatTradeDetailService, "getClosedTradeDetails">,
    private readonly scope: WorkspaceAccessScope,
    private readonly selectedAccountId: string,
    private readonly asOfUtc: string,
  ) {}

  dispatch(toolCallId: string, request: CoachAiChatFactualToolRequest): CoachAiChatFactualToolResponse {
    if (this.snapshots.length >= 4) throw new CoachAiChatFactualToolError("result_too_large");
    let result: CoachAiChatFactualToolResponse;
    switch (request.toolName) {
      case "summarize_closed_trades":
        result = this.tools.summarizeClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "group_closed_trades":
        result = this.tools.groupClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "list_closed_trades":
        result = this.tools.listClosedTrades(this.scope, this.selectedAccountId, request, this.asOfUtc);
        break;
      case "get_closed_trade_details":
        result = this.details.getClosedTradeDetails(this.scope, this.selectedAccountId, request);
        break;
      default:
        return unsupportedTool(request);
    }
    const serializedResultBytes = Buffer.byteLength(JSON.stringify(result), "utf8");
    if (this.totalBytes + serializedResultBytes > COACH_AI_CHAT_FACTUAL_RESULTS_MAX_BYTES) {
      throw new CoachAiChatFactualToolError("result_too_large");
    }
    this.totalBytes += serializedResultBytes;
    this.snapshots.push(Object.freeze({
      toolCallId,
      toolName: request.toolName,
      request: Object.freeze({ ...request }),
      result,
      serializedResultBytes,
    }));
    return result;
  }

  snapshotsForPersistence(): readonly CoachAiChatFactualToolCallSnapshot[] {
    return Object.freeze([...this.snapshots]);
  }

  totalSerializedResultBytes(): number {
    return this.totalBytes;
  }
}
