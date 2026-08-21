"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type {
  CoachAiChatAnalysisScope,
  CoachAiChatConversation,
  CoachAiChatMessage,
} from "@/src/modules/coach/contracts/ai-chat-contracts";
import type {
  CoachAiChatEvidenceCard,
  CoachAiChatMessageEvidence,
} from "@/src/modules/coach/contracts/coach-ai-chat-evidence-contracts";
import type {
  CoachAiDailyCompanionContextSelector,
  CoachAiDailyCompanionDraft,
} from "@/src/modules/coach/contracts/ai-daily-companion-contracts";
import type { CoachAiManualEntryDraft } from "@/src/modules/coach/contracts/ai-manual-entry-draft-contracts";
import type { CoachAiReviewDeliveryChangeDraft } from "@/src/modules/coach/contracts/ai-review-delivery-change-contracts";
import type { CoachAiChatActionDraft } from "@/src/modules/coach/contracts/ai-chat-action-draft-contracts";
import { formatCoachAiMoneyForDisplay } from "@/src/modules/coach/presentation/coach-ai-money-formatters";
import type {
  CoachAiMeetLinksMemory,
  CoachAiRelationshipMemory,
  CoachAiRelationshipMemoryView,
} from "@/src/modules/coach/contracts/ai-relationship-memory-contracts";

import { AiChatManualEntryCard } from "./ai-chat-manual-entry-card";
import { AiChatDailyCompanionCard } from "./ai-chat-daily-companion-card";
import { AiChatReviewDeliveryChangeCard } from "./ai-chat-review-delivery-change-card";
import { AiChatActionDraftCard } from "./ai-chat-action-draft-card";

type ConversationResponse = Readonly<{
  status: "ready";
  conversations: readonly CoachAiChatConversation[];
  nextCursor: string | null;
}>;

type MessageResponse = Readonly<{
  status: "ready";
  conversationId: string;
  messages: readonly CoachAiChatMessage[];
  evidence: readonly CoachAiChatMessageEvidence[];
  nextCursor: string | null;
}>;

type GenerationResponse = Readonly<{
  status: "completed" | "pending" | "blocked" | "failed";
  assistantMessageId: string;
  manualEntryDraft: CoachAiManualEntryDraft | null;
  dailyCompanionDraft: CoachAiDailyCompanionDraft | null;
  reviewDeliveryChangeDraft: CoachAiReviewDeliveryChangeDraft | null;
  actionDraft: CoachAiChatActionDraft | null;
}>;

type QualityFeedbackResponse = Readonly<{
  status: "ready";
  caseId: string;
  eventKinds: readonly string[];
}>;

type ManualEntryDraftResponse = Readonly<{
  status: "ready";
  conversationId: string;
  drafts: readonly CoachAiManualEntryDraft[];
}>;

type DailyCompanionDraftResponse = Readonly<{
  status: "ready";
  conversationId: string;
  drafts: readonly CoachAiDailyCompanionDraft[];
}>;

type ReviewDeliveryChangeDraftResponse = Readonly<{
  status: "ready";
  conversationId: string;
  drafts: readonly CoachAiReviewDeliveryChangeDraft[];
}>;

type ActionDraftResponse = Readonly<{
  status: "ready";
  conversationId: string;
  drafts: readonly CoachAiChatActionDraft[];
}>;

type RetryRequest = Readonly<{
  conversationId: string;
  question: string;
  clientRequestId: string;
  contextKey: string;
}>;

const conversationsEndpoint = "/api/coach/chat/conversations";
const relationshipMemoryEndpoint = "/api/coach/chat/memories";

type ReadinessResponse = Readonly<{
  status: "ready";
  readiness: Readonly<{ state: "ready" | "unavailable" }>;
}>;

type RelationshipMemoryResponse = Readonly<{
  status: "ready";
  memory: CoachAiRelationshipMemoryView;
}>;

type DirectMemoryRequest = Readonly<{
  memoryText: string;
  category: CoachAiRelationshipMemory["category"];
  scopeKind: "user" | "account";
}>;

function directMemoryRequest(value: string): DirectMemoryRequest | null {
  const match = value.match(/^\s*(?:please\s+)?remember(?:\s+(?:this|that))?\s*[:,-]?\s+(.+)$/iu);
  if (!match?.[1]?.trim()) return null;
  let memoryText = match[1].trim();
  const explicitUserScope = /\s+(?:across|for)\s+traderslink\.?$/iu.test(memoryText);
  const explicitAccountScope = /\s+for\s+(?:this|my)\s+account\.?$/iu.test(memoryText);
  memoryText = memoryText
    .replace(/\s+(?:across|for)\s+traderslink\.?$/iu, "")
    .replace(/\s+for\s+(?:this|my)\s+account\.?$/iu, "")
    .trim();
  if (!memoryText) return null;
  const lower = memoryText.toLocaleLowerCase();
  const category: CoachAiRelationshipMemory["category"] = /\bcall me\b/u.test(lower)
    ? "preferred_name"
    : /\bexperience|trader for\b/u.test(lower)
      ? "experience"
      : /\bsetup|breakout|pullback|reversal|momentum\b/u.test(lower)
        ? "setups"
        : /\bfomo|fear|hesitat|impatient|revenge|frustrat|overconfiden|boredom\b/u.test(lower)
          ? "emotional_pattern"
          : /\breview|weekly|monthly|every (?:day|session|week)\b/u.test(lower)
            ? "routine"
            : /\bfocus|working on|goal\b/u.test(lower)
              ? "current_focus"
              : "preference";
  const naturallyUserWide = category === "preferred_name" || category === "experience";
  return Object.freeze({
    memoryText,
    category,
    scopeKind: explicitAccountScope ? "account" :
      explicitUserScope || naturallyUserWide ? "user" : "account",
  });
}

function LinksAvatar({ size = 34 }: Readonly<{ size?: number }>) {
  return (
    <Box
      alt="Links, TradersLink AI assistant"
      component="img"
      src="/icons/traderlink-512.png"
      sx={{ borderRadius: "50%", flexShrink: 0, height: size, objectFit: "cover", width: size }}
    />
  );
}

function currentEasternDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function rememberedDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function LinksFirstImpression({
  disabled,
  onAsk,
  onMemory,
}: Readonly<{
  disabled: boolean;
  onAsk: (suggestion: string) => void;
  onMemory: () => void;
}>) {
  const suggestions = [
    "Show me what you can help with",
    "Review my recent trading",
    "Help me choose a trading focus",
  ] as const;
  return (
    <Stack spacing={2.25} sx={{ alignItems: "center", justifyContent: "center", minHeight: "100%", py: 4, textAlign: "center" }}>
      <LinksAvatar size={76} />
      <Typography sx={{ fontWeight: 850 }} variant="h3">Hey, I’m Links.</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 600 }} variant="body1">
        I can connect your trades, reviews, rules, analytics and goals so we can look at the full picture together. I’ll remember only what you ask me to remember, and you stay in control.
      </Typography>
      <Stack spacing={1} sx={{ maxWidth: 460, width: "100%" }}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">A few ways we can start</Typography>
        {suggestions.map((suggestion) => (
          <Button disabled={disabled} key={suggestion} onClick={() => onAsk(suggestion)} variant="outlined">
            {suggestion}
          </Button>
        ))}
      </Stack>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Nothing becomes a memory unless you ask or approve it.
        </Typography>
        <Button onClick={onMemory} size="small" sx={{ display: "block", mx: "auto", mt: 0.5 }}>
          How memory works
        </Button>
      </Box>
    </Stack>
  );
}

function RelationshipMemoryScreen({
  onBack,
  onTellLinks,
}: Readonly<{
  onBack: () => void;
  onTellLinks: () => void;
}>) {
  const [view, setView] = useState<CoachAiRelationshipMemoryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<CoachAiRelationshipMemory | null>(null);
  const [editText, setEditText] = useState("");
  const [editScope, setEditScope] = useState<"user" | "account">("user");
  const [forgetting, setForgetting] = useState<CoachAiRelationshipMemory | null>(null);
  const [confirmTurnOff, setConfirmTurnOff] = useState(false);
  const [confirmForgetAll, setConfirmForgetAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        relationshipMemoryEndpoint,
        { cache: "no-store" },
      ));
      setView(response.memory);
    } catch {
      setNotice("What Links remembers could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateSettings(action: "turn_off" | "turn_on" | "forget_all"): Promise<void> {
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        `${relationshipMemoryEndpoint}/settings`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(action === "forget_all"
            ? { action: "forget_all" }
            : { action: "set_enabled", enabled: action === "turn_on" }),
        },
      ));
      setView(response.memory);
      setConfirmTurnOff(false);
      setConfirmForgetAll(false);
    } catch {
      setNotice("Relationship memory could not be changed right now.");
    }
  }

  async function saveEdit(): Promise<void> {
    if (!editing || editText.trim().length === 0) return;
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        `${relationshipMemoryEndpoint}/${editing.memoryId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            text: editText.trim(),
            scope: editScope === "user"
              ? { kind: "user" }
              : { kind: "account", accountId: view?.currentAccount.accountId },
          }),
        },
      ));
      setView(response.memory);
      setEditing(null);
    } catch {
      setNotice("That memory could not be updated right now.");
    }
  }

  async function forget(): Promise<void> {
    if (!forgetting) return;
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        `${relationshipMemoryEndpoint}/${forgetting.memoryId}`,
        { method: "DELETE" },
      ));
      setView(response.memory);
      setForgetting(null);
    } catch {
      setNotice("That memory could not be forgotten right now.");
    }
  }

  async function reconfirm(memory: CoachAiRelationshipMemory): Promise<void> {
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        `${relationshipMemoryEndpoint}/${memory.memoryId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: memory.text, reconfirm: true }),
        },
      ));
      setView(response.memory);
    } catch {
      setNotice("That memory could not be confirmed right now.");
    }
  }

  const userMemories = view?.memories.filter((memory) => memory.scope.kind === "user") ?? [];
  const accountMemories = view?.memories.filter((memory) => memory.scope.kind === "account") ?? [];
  const enabled = view?.settings.enabled ?? true;
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 1.5, sm: 3 }, py: 2.5 }}>
      <Stack spacing={2.5} sx={{ maxWidth: 720, mx: "auto" }}>
        <Typography color="text.secondary" variant="body2">
          These are the things you asked Links to carry into future conversations. You can change or forget any of them.
        </Typography>
        {notice ? <Alert severity="info">{notice}</Alert> : null}
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Relationship memory</Typography>
            <Typography color="text.secondary" variant="caption">{enabled ? "On" : "Off"}</Typography>
          </Box>
          <Switch
            checked={enabled}
            disabled={!view}
            slotProps={{ input: { "aria-label": "Relationship memory" } }}
            onChange={(_, checked) => checked ? void updateSettings("turn_on") : setConfirmTurnOff(true)}
          />
        </Stack>
        {loading ? <Stack direction="row" spacing={1}><CircularProgress size={20} /><Typography>Loading memories…</Typography></Stack> : null}
        {!loading && view && view.memories.length === 0 ? (
          <Paper sx={{ p: 2.5, textAlign: "center" }} variant="outlined">
            <Typography sx={{ fontWeight: 800 }}>Links isn’t remembering anything yet.</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
              When something would help future conversations, you can ask Links to remember it. Nothing is saved without your approval.
            </Typography>
            <Button onClick={onTellLinks} sx={{ mt: 1.5 }} variant="outlined">Tell Links something to remember</Button>
          </Paper>
        ) : null}
        {userMemories.length > 0 ? <MemorySection memories={userMemories} onEdit={(memory) => { setEditing(memory); setEditText(memory.text); setEditScope(memory.scope.kind); }} onForget={setForgetting} onReconfirm={(memory) => void reconfirm(memory)} title="About you" /> : null}
        {accountMemories.length > 0 && view ? <MemorySection memories={accountMemories} onEdit={(memory) => { setEditing(memory); setEditText(memory.text); setEditScope(memory.scope.kind); }} onForget={setForgetting} onReconfirm={(memory) => void reconfirm(memory)} title={view.currentAccount.displayName} /> : null}
        {view && view.memories.length > 0 ? <Button onClick={onTellLinks} sx={{ alignSelf: "flex-start" }} variant="outlined">Tell Links something to remember</Button> : null}
        {view && view.memories.length > 0 ? <Button color="error" onClick={() => setConfirmForgetAll(true)} sx={{ alignSelf: "flex-start" }}>Forget all memories</Button> : null}
        <Button onClick={onBack} startIcon={<ArrowBackRoundedIcon />} sx={{ alignSelf: "flex-start" }}>Back to chat</Button>
      </Stack>

      <Dialog fullWidth maxWidth="sm" onClose={() => setEditing(null)} open={editing !== null}>
        <DialogTitle>Update this memory</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField autoFocus fullWidth label="Memory" multiline minRows={3} onChange={(event) => setEditText(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} value={editText} />
            <TextField fullWidth label="Use in" onChange={(event) => setEditScope(event.target.value as "user" | "account")} select value={editScope}>
              <MenuItem value="user">Across TradersLink</MenuItem>
              <MenuItem value="account">{view?.currentAccount.displayName ?? "Journal account"} only</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button disabled={!editText.trim()} onClick={() => void saveEdit()} variant="contained">Update memory</Button></DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" onClose={() => setForgetting(null)} open={forgetting !== null}>
        <DialogTitle>Forget this?</DialogTitle>
        <DialogContent><Typography>Links will stop using this in future conversations. Past messages won’t change.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setForgetting(null)}>Keep it</Button><Button color="error" onClick={() => void forget()} variant="contained">Forget</Button></DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" onClose={() => setConfirmTurnOff(false)} open={confirmTurnOff}>
        <DialogTitle>Turn off relationship memory?</DialogTitle>
        <DialogContent><Typography>Links will stop using and suggesting memories. Your saved memories will stay here until you forget them.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setConfirmTurnOff(false)}>Keep on</Button><Button onClick={() => void updateSettings("turn_off")} variant="contained">Turn off</Button></DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" onClose={() => setConfirmForgetAll(false)} open={confirmForgetAll}>
        <DialogTitle>Forget everything Links remembers?</DialogTitle>
        <DialogContent><Typography>Links will stop using every saved relationship memory. Past conversations won’t change.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setConfirmForgetAll(false)}>Cancel</Button><Button color="error" onClick={() => void updateSettings("forget_all")} variant="contained">Forget all memories</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function MemorySection({
  memories,
  onEdit,
  onForget,
  onReconfirm,
  title,
}: Readonly<{
  memories: readonly CoachAiRelationshipMemory[];
  onEdit: (memory: CoachAiRelationshipMemory) => void;
  onForget: (memory: CoachAiRelationshipMemory) => void;
  onReconfirm: (memory: CoachAiRelationshipMemory) => void;
  title: string;
}>) {
  return (
    <Stack spacing={1}>
      <Typography sx={{ fontWeight: 850 }}>{title}</Typography>
      {memories.map((memory) => (
        <Paper key={memory.memoryId} sx={{ p: 2 }} variant="outlined">
          <Typography sx={{ overflowWrap: "anywhere" }}>{memory.text}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">{memory.scopeLabel}</Typography>
          <Typography color="text.secondary" sx={{ display: "block" }} variant="caption">
            Remembered{memory.sourceConversationTitle ? ` from ${memory.sourceConversationTitle}` : ""} · {rememberedDate(memory.rememberedAtUtc)}
          </Typography>
          {memory.needsReview ? <Typography color="warning.main" sx={{ mt: 0.5 }} variant="caption">Still true? Review this memory before Links treats it as current.</Typography> : null}
          {memory.needsReview ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button onClick={() => onReconfirm(memory)} size="small">Keep it</Button>
              <Button onClick={() => onEdit(memory)} size="small">Update</Button>
              <Button color="error" onClick={() => onForget(memory)} size="small">Forget</Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}><Button onClick={() => onEdit(memory)} size="small">Edit</Button><Button color="error" onClick={() => onForget(memory)} size="small">Forget</Button></Stack>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

type MeetLinksAnswers = Readonly<{
  name: string;
  experience: string;
  approach: string;
  markets: readonly string[];
  setups: readonly string[];
  focus: readonly string[];
  emotions: readonly string[];
  routine: readonly string[];
  other: string;
  otherScope: "user" | "account";
}>;

function MeetLinksFlow({
  account,
  onComplete,
  onDirtyChange,
}: Readonly<{
  account: Readonly<{ accountId: string; displayName: string }>;
  onComplete: (memory: CoachAiRelationshipMemoryView) => void;
  onDirtyChange: (dirty: boolean) => void;
}>) {
  const emptyAnswers: MeetLinksAnswers = Object.freeze({
    name: "", experience: "", approach: "", markets: Object.freeze([]),
    setups: Object.freeze([]), focus: Object.freeze([]), emotions: Object.freeze([]),
    routine: Object.freeze([]), other: "", otherScope: "account",
  });
  const [stage, setStage] = useState<"intro" | "questions" | "review">("intro");
  const [step, setStep] = useState(0);
  const [marketScreen, setMarketScreen] = useState(false);
  const [answers, setAnswers] = useState<MeetLinksAnswers>(emptyAnswers);
  const [proposals, setProposals] = useState<readonly CoachAiMeetLinksMemory[]>([]);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty = Object.entries(answers).some(([key, value]) =>
    key === "otherScope" ? false : Array.isArray(value) ? value.length > 0 : value.length > 0);
  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  function setText(field: "name" | "experience" | "approach" | "other", value: string): void {
    setAnswers((current) => Object.freeze({ ...current, [field]: value }));
  }

  function toggle(field: "markets" | "setups" | "focus" | "emotions" | "routine", value: string): void {
    setAnswers((current) => {
      const exclusive = value === "Nothing right now" || value === "Not right now";
      const values = exclusive
        ? current[field]
        : current[field].filter((item) => item !== "Nothing right now" && item !== "Not right now");
      return Object.freeze({
        ...current,
        [field]: Object.freeze(exclusive
          ? values.includes(value) ? [] : [value]
          : values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value]),
      });
    });
  }

  function buildProposals(): readonly CoachAiMeetLinksMemory[] {
    const userScope = Object.freeze({ kind: "user" as const });
    const accountScope = Object.freeze({ kind: "account" as const, accountId: account.accountId });
    const values: CoachAiMeetLinksMemory[] = [];
    if (answers.name.trim()) values.push(Object.freeze({ scope: userScope, category: "preferred_name", text: `Call me ${answers.name.trim()}.` }));
    if (answers.experience) {
      const experienceText: Readonly<Record<string, string>> = Object.freeze({
        "Getting started": "I am getting started with trading.",
        "Building experience": "I am building my trading experience.",
        Experienced: "I am an experienced trader.",
        "Long-time trader": "I am a long-time trader.",
      });
      values.push(Object.freeze({
        scope: userScope,
        category: "experience",
        text: experienceText[answers.experience] ?? answers.experience.trim(),
      }));
    }
    if (answers.approach) {
      const approachText: Readonly<Record<string, string>> = Object.freeze({
        "Day trading": "I mostly day trade.",
        "Swing trading": "I mostly swing trade.",
        Both: "I day trade and swing trade.",
        "Still figuring it out": "I am still figuring out my trading approach.",
      });
      values.push(Object.freeze({
        scope: accountScope,
        category: "trading_approach",
        text: approachText[answers.approach] ?? answers.approach.trim(),
      }));
    }
    const selectedWords = (items: readonly string[]): string => items
      .map((item) => item.startsWith("Other: ") ? item.slice(7) : item)
      .join(", ");
    if (answers.markets.length > 0) values.push(Object.freeze({ scope: accountScope, category: "markets_products", text: `I trade ${selectedWords(answers.markets).toLowerCase()}.` }));
    if (answers.setups.length > 0) values.push(Object.freeze({ scope: accountScope, category: "setups", text: `I look for ${selectedWords(answers.setups).toLowerCase()} setups.` }));
    if (answers.focus.length > 0) values.push(Object.freeze({ scope: accountScope, category: "current_focus", text: `I am working on ${selectedWords(answers.focus).toLowerCase()}.` }));
    const emotions = answers.emotions.filter((value) => value !== "Nothing right now");
    const routine = answers.routine.filter((value) => value !== "Not right now");
    if (emotions.length > 0) values.push(Object.freeze({ scope: accountScope, category: "emotional_pattern", text: `${selectedWords(emotions)} can affect my trading.` }));
    if (routine.length > 0) values.push(Object.freeze({ scope: accountScope, category: "routine", text: `I want to review my trading ${selectedWords(routine).toLowerCase()}.` }));
    if (answers.other.trim()) values.push(Object.freeze({ scope: answers.otherScope === "user" ? userScope : accountScope, category: "other", text: answers.other.trim() }));
    return Object.freeze(values);
  }

  async function finish(memories: readonly CoachAiMeetLinksMemory[]): Promise<void> {
    setSaving(true);
    setNotice(null);
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        "/api/coach/chat/meet-links",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "complete", memories }),
        },
      ));
      onDirtyChange(false);
      onComplete(response.memory);
    } catch {
      setNotice("Meet Links could not be saved right now. Your answers are still here.");
    } finally {
      setSaving(false);
    }
  }

  async function skipAll(): Promise<void> {
    setSaving(true);
    try {
      const response = await readJson<RelationshipMemoryResponse>(await fetch(
        "/api/coach/chat/meet-links",
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "skip" }) },
      ));
      onDirtyChange(false);
      onComplete(response.memory);
    } catch {
      setNotice("Meet Links could not be closed right now.");
    } finally {
      setSaving(false);
    }
  }

  function next(): void {
    if (step === 2 && !marketScreen) {
      setMarketScreen(true);
      return;
    }
    if (step < 7) {
      setStep((current) => current + 1);
      setMarketScreen(false);
      return;
    }
    const built = buildProposals();
    setProposals(built);
    setStage("review");
  }

  function skipCurrent(): void {
    if (step === 0) setText("name", "");
    else if (step === 1) setText("experience", "");
    else if (step === 2 && !marketScreen) setText("approach", "");
    else if (step === 2) setAnswers((current) => Object.freeze({ ...current, markets: Object.freeze([]) }));
    else if (step === 3) setAnswers((current) => Object.freeze({ ...current, setups: Object.freeze([]) }));
    else if (step === 4) setAnswers((current) => Object.freeze({ ...current, focus: Object.freeze([]) }));
    else if (step === 5) setAnswers((current) => Object.freeze({ ...current, emotions: Object.freeze([]) }));
    else if (step === 6) setAnswers((current) => Object.freeze({ ...current, routine: Object.freeze([]) }));
    else setText("other", "");
    next();
  }

  function back(): void {
    if (step === 2 && marketScreen) {
      setMarketScreen(false);
    } else if (step > 0) {
      setStep((current) => current - 1);
      setMarketScreen(false);
    } else {
      setStage("intro");
    }
  }

  if (stage === "intro") {
    return (
      <Stack spacing={2.5} sx={{ alignItems: "center", flex: 1, justifyContent: "center", maxWidth: 620, mx: "auto", px: 2.5, textAlign: "center" }}>
        <LinksAvatar size={76} />
        <Typography sx={{ fontWeight: 850 }} variant="h3">Hey, I’m Links. Let’s get to know each other.</Typography>
        <Typography color="text.secondary">Tell me a little about how you trade and what you want to work on. You can skip anything, and I’ll show you exactly what I’m going to remember before anything is saved.</Typography>
        <Paper sx={{ bgcolor: "#EEF4FF", p: 2, textAlign: "left" }} variant="outlined">
          <Typography sx={{ fontWeight: 800 }} variant="body2">One useful thing about Links</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">When something matters for future conversations, just say “remember this.” I’ll carry it forward so we can build on it next time.</Typography>
        </Paper>
        {notice ? <Alert severity="info">{notice}</Alert> : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button disabled={saving} onClick={() => setStage("questions")} variant="contained">Let’s do it</Button>
          <Button disabled={saving} onClick={() => void skipAll()}>Skip for now</Button>
        </Stack>
      </Stack>
    );
  }

  if (stage === "review") {
    return (
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2.5, py: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 620, mx: "auto" }}>
          <Typography sx={{ fontWeight: 850 }} variant="h3">What Links will remember</Typography>
          <Typography color="text.secondary">Review the wording and where each memory will be used. You can change or remove anything before saving.</Typography>
          {notice ? <Alert severity="info">{notice}</Alert> : null}
          {proposals.length === 0 ? <Typography color="text.secondary">You skipped every question, so there is nothing to save.</Typography> : null}
          {proposals.map((proposal, index) => (
            <Paper key={`${proposal.category}-${index}`} sx={{ p: 2 }} variant="outlined">
              <TextField fullWidth label={`Memory ${index + 1}`} multiline minRows={2} onChange={(event) => setProposals((current) => Object.freeze(current.map((item, itemIndex) => itemIndex === index ? Object.freeze({ ...item, text: event.target.value }) : item)))} slotProps={{ htmlInput: { maxLength: 500 } }} value={proposal.text} />
              <TextField fullWidth label="Use in" onChange={(event) => setProposals((current) => Object.freeze(current.map((item, itemIndex) => itemIndex === index ? Object.freeze({ ...item, scope: event.target.value === "user" ? Object.freeze({ kind: "user" as const }) : Object.freeze({ kind: "account" as const, accountId: account.accountId }) }) : item)))} select size="small" sx={{ mt: 1.5 }} value={proposal.scope.kind}>
                <MenuItem value="user">Across TradersLink</MenuItem>
                <MenuItem value="account">{account.displayName} only</MenuItem>
              </TextField>
              <Button color="error" onClick={() => setProposals((current) => Object.freeze(current.filter((_, itemIndex) => itemIndex !== index)))} size="small" sx={{ mt: 1 }}>Remove</Button>
            </Paper>
          ))}
          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}>
            <Button disabled={saving} onClick={() => { setStage("questions"); setStep(7); }}>Back</Button>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button disabled={saving} onClick={() => void finish([])}>Start without saving</Button>
              <Button disabled={saving || proposals.some((proposal) => !proposal.text.trim())} onClick={() => void finish(proposals)} variant="contained">Remember and start chatting</Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    );
  }

  const question = meetLinksQuestion(step, marketScreen, answers, setText, toggle, account, setAnswers);
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: 2.5, py: 3 }}>
      <Stack spacing={2.5} sx={{ maxWidth: 600, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box><Typography sx={{ fontWeight: 800 }}>{step + 1} of 8</Typography>{step >= 2 ? <Typography color="text.secondary" variant="caption">{account.displayName}</Typography> : null}</Box>
          <Button onClick={() => dirty ? setSkipConfirmOpen(true) : void skipAll()} size="small">Skip for now</Button>
        </Stack>
        {question}
        {notice ? <Alert severity="info">{notice}</Alert> : null}
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Button onClick={back}>Back</Button>
          <Stack direction="row" spacing={1}><Button onClick={skipCurrent}>Skip</Button><Button onClick={next} variant="contained">{step === 7 ? "Continue to review" : "Continue"}</Button></Stack>
        </Stack>
      </Stack>
      <Dialog onClose={() => setSkipConfirmOpen(false)} open={skipConfirmOpen}>
        <DialogTitle>Skip Meet Links?</DialogTitle>
        <DialogContent><Typography>Your answers haven’t been saved and will be cleared.</Typography></DialogContent>
        <DialogActions><Button onClick={() => setSkipConfirmOpen(false)}>Keep going</Button><Button color="error" onClick={() => void skipAll()}>Leave without saving</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

function meetLinksQuestion(
  step: number,
  marketScreen: boolean,
  answers: MeetLinksAnswers,
  setText: (field: "name" | "experience" | "approach" | "other", value: string) => void,
  toggle: (field: "markets" | "setups" | "focus" | "emotions" | "routine", value: string) => void,
  account: Readonly<{ accountId: string; displayName: string }>,
  setAnswers: Dispatch<SetStateAction<MeetLinksAnswers>>,
) {
  const choices = (
    field: "markets" | "setups" | "focus" | "emotions" | "routine",
    values: readonly string[],
  ) => <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{values.map((value) => <Chip clickable color={answers[field].includes(value) ? "primary" : "default"} key={value} label={value} onClick={() => toggle(field, value)} variant={answers[field].includes(value) ? "filled" : "outlined"} />)}</Stack>;
  const customChoice = (
    field: "markets" | "setups" | "focus" | "emotions" | "routine",
    label: string,
  ) => {
    const existing = answers[field].find((value) => value.startsWith("Other: "))?.slice(7) ?? "";
    return <TextField fullWidth label={label} onChange={(event) => setAnswers((current) => Object.freeze({ ...current, [field]: Object.freeze([...current[field].filter((value) => !value.startsWith("Other: ") && value !== "Nothing right now" && value !== "Not right now"), ...(event.target.value.trim() ? [`Other: ${event.target.value}`] : [])]) }))} value={existing} />;
  };
  if (step === 0) return <><Typography sx={{ fontWeight: 850 }} variant="h3">What should I call you?</Typography><TextField fullWidth label="Name" onChange={(event) => setText("name", event.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} value={answers.name} /></>;
  if (step === 1) return <><Typography sx={{ fontWeight: 850 }} variant="h3">How would you describe your trading experience?</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{["Getting started", "Building experience", "Experienced", "Long-time trader"].map((value) => <Chip clickable color={answers.experience === value ? "primary" : "default"} key={value} label={value} onClick={() => setText("experience", value)} variant={answers.experience === value ? "filled" : "outlined"} />)}</Stack><TextField fullWidth label="Describe your experience" onChange={(event) => setText("experience", event.target.value)} value={answers.experience} /></>;
  if (step === 2 && !marketScreen) return <><Typography sx={{ fontWeight: 850 }} variant="h3">How do you trade most often?</Typography><Typography color="text.secondary">Choose the answer that feels closest.</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>{["Day trading", "Swing trading", "Both", "Still figuring it out"].map((value) => <Chip clickable color={answers.approach === value ? "primary" : "default"} key={value} label={value} onClick={() => setText("approach", value)} variant={answers.approach === value ? "filled" : "outlined"} />)}</Stack><TextField fullWidth label="Something else" onChange={(event) => setText("approach", event.target.value)} value={answers.approach} /></>;
  if (step === 2) return <><Typography sx={{ fontWeight: 850 }} variant="h3">What markets or products do you trade?</Typography><Typography color="text.secondary">Choose any that fit. This helps Links know your trading. It doesn’t mean every market or broker can be imported yet.</Typography>{choices("markets", ["Stocks", "Options", "Futures", "Forex", "Crypto"])}{customChoice("markets", "Something else")}</>;
  if (step === 3) return <><Typography sx={{ fontWeight: 850 }} variant="h3">What types of setups do you look for?</Typography><Typography color="text.secondary">Choose any that fit.</Typography>{choices("setups", ["Breakouts", "Pullbacks", "Reversals", "Momentum", "Catalyst-driven"])}{customChoice("setups", "Add your setup wording")}</>;
  if (step === 4) return <><Typography sx={{ fontWeight: 850 }} variant="h3">What are you working on right now?</Typography><Typography color="text.secondary">Choose any that fit.</Typography>{choices("focus", ["Entries", "Exits", "Following rules", "Selectivity", "Position sizing", "Patience", "Review consistency", "Understanding my data"])}{customChoice("focus", "Something else")}</>;
  if (step === 5) return <><Typography sx={{ fontWeight: 850 }} variant="h3">Are there emotions or situations that tend to affect your trading?</Typography><Typography color="text.secondary">Share only what you want Links to keep in mind. Choose any that fit.</Typography>{choices("emotions", ["FOMO", "Hesitation", "Impatience", "Frustration after a loss", "Overconfidence after a win", "Revenge trading", "Fear", "Boredom", "Nothing right now"])}{customChoice("emotions", "Describe what tends to affect your trading")}</>;
  if (step === 6) return <><Typography sx={{ fontWeight: 850 }} variant="h3">Is there a review routine you want to build?</Typography><Typography color="text.secondary">Choose any that fit. Reminders still require a separate confirmation.</Typography>{choices("routine", ["After each session", "Weekly", "Monthly", "Not right now"])}{customChoice("routine", "Something else")}</>;
  return <><Typography sx={{ fontWeight: 850 }} variant="h3">Is there anything else I should know?</Typography><Typography color="text.secondary">Share anything else you’d like Links to keep in mind. Don’t include passwords, broker login details, account numbers or other secrets.</Typography><TextField fullWidth helperText={`${answers.other.length}/500`} label="Anything else" minRows={4} multiline onChange={(event) => setText("other", event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} value={answers.other} /><TextField fullWidth label="Use in" onChange={(event) => setAnswers((current) => Object.freeze({ ...current, otherScope: event.target.value as "user" | "account" }))} select value={answers.otherScope}><MenuItem value="account">{account.displayName} only</MenuItem><MenuItem value="user">Across TradersLink</MenuItem></TextField></>;
}

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json() as unknown;
  if (!response.ok || typeof value !== "object" || value === null) throw new Error("request_failed");
  return value as T;
}

function EvidenceCards({ cards }: Readonly<{ cards: readonly CoachAiChatEvidenceCard[] }>) {
  if (cards.length === 0) return null;
  return (
    <Stack spacing={0.75} sx={{ mt: 0.75, width: "100%" }}>
      {cards.map((card, index) => (
        <Paper
          key={`${card.title}-${index}`}
          sx={{ bgcolor: "background.paper", borderColor: "#C8DAF7", p: 1.25 }}
          variant="outlined"
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { sm: "center" } }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800 }} variant="caption">{card.title}</Typography>
            </Box>
            {card.href && card.linkLabel ? (
              <Button href={card.href} size="small" sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}>
                {card.linkLabel}
              </Button>
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

function ConversationList({
  activeConversationId,
  archived,
  conversations,
  loading,
  nextCursor,
  onLoadMore,
  onNew,
  onSearchChange,
  onSelect,
  onToggleArchived,
  search,
}: Readonly<{
  activeConversationId: string | null;
  archived: boolean;
  conversations: readonly CoachAiChatConversation[];
  loading: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
  onNew: () => void;
  onSearchChange: (value: string) => void;
  onSelect: (conversationId: string) => void;
  onToggleArchived: () => void;
  search: string;
}>) {
  return (
    <Stack sx={{ height: "100%" }}>
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <Button fullWidth onClick={onNew} startIcon={<AddRoundedIcon />} variant="contained">New conversation</Button>
        <Button onClick={onToggleArchived} size="small" startIcon={archived ? <ChatBubbleOutlineRoundedIcon /> : <ArchiveRoundedIcon />} variant="text">
          {archived ? "Active conversations" : "Archived conversations"}
        </Button>
        <TextField
          fullWidth
          label="Search conversations"
          onChange={(event) => onSearchChange(event.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
            },
          }}
          value={search}
        />
      </Stack>
      <Divider />
      <List disablePadding sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: 1 }}>
        {conversations.map((conversation) => (
          <ListItemButton
            key={conversation.conversationId}
            onClick={() => onSelect(conversation.conversationId)}
            selected={activeConversationId === conversation.conversationId}
            sx={{ mx: 1, borderRadius: 1.5 }}
          >
            <ListItemText
              primary={conversation.title}
              secondary={dateTime(conversation.updatedAtUtc)}
              slotProps={{ primary: { noWrap: true, sx: { fontWeight: 700 } }, secondary: { variant: "caption" } }}
            />
          </ListItemButton>
        ))}
        {!loading && conversations.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography color="text.secondary" variant="body2">
              {search.trim().length > 0
                ? "No conversations match your search."
                : archived ? "No archived conversations." : "No conversations yet."}
            </Typography>
          </Box>
        ) : null}
      </List>
      {nextCursor ? <Button onClick={onLoadMore} sx={{ m: 1 }}>Load more</Button> : null}
      {loading ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", p: 2 }}><CircularProgress size={18} /><Typography color="text.secondary" variant="caption">Loading conversations...</Typography></Stack> : null}
    </Stack>
  );
}

export function AiChatClient({
  initialContext = null,
  initialQuestion = null,
  contextRequestId = 0,
  onClose,
  presentation = "page",
}: Readonly<{
  initialContext?: CoachAiDailyCompanionContextSelector | null;
  initialQuestion?: string | null;
  contextRequestId?: number;
  onClose?: () => void;
  presentation?: "page" | "drawer";
}>) {
  const theme = useTheme();
  const pathname = usePathname();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const drawerPresentation = presentation === "drawer";
  const endRef = useRef<HTMLDivElement | null>(null);
  const messageScrollRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef(0);
  const dailyContextConversationIdRef = useRef<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const [activeConversationSearch, setActiveConversationSearch] = useState("");
  const [conversations, setConversations] = useState<readonly CoachAiChatConversation[]>([]);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly CoachAiChatMessage[]>([]);
  const [messageEvidence, setMessageEvidence] = useState<readonly CoachAiChatMessageEvidence[]>([]);
  const [manualEntryDrafts, setManualEntryDrafts] = useState<readonly CoachAiManualEntryDraft[]>([]);
  const [dailyCompanionDrafts, setDailyCompanionDrafts] = useState<readonly CoachAiDailyCompanionDraft[]>([]);
  const [reviewDeliveryChangeDrafts, setReviewDeliveryChangeDrafts] = useState<readonly CoachAiReviewDeliveryChangeDraft[]>([]);
  const [actionDrafts, setActionDrafts] = useState<readonly CoachAiChatActionDraft[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<"loading" | "ready" | "unavailable">("loading");
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryInfoOpen, setMemoryInfoOpen] = useState(false);
  const [meetLinksCandidate, setMeetLinksCandidate] = useState<CoachAiRelationshipMemoryView | null>(null);
  const [meetLinksOpen, setMeetLinksOpen] = useState(false);
  const [meetLinksDirty, setMeetLinksDirty] = useState(false);
  const [meetLinksLeaveOpen, setMeetLinksLeaveOpen] = useState(false);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [flaggedAnswerIds, setFlaggedAnswerIds] = useState<ReadonlySet<string>>(() => new Set());
  const [dailyContext, setDailyContext] = useState(initialContext);
  const initialScopeDate = initialContext?.tradingDate ?? currentEasternDate();
  const [analysisKind, setAnalysisKind] = useState<CoachAiChatAnalysisScope["kind"]>(
    initialContext ? "day" : "all",
  );
  const [scopeDate, setScopeDate] = useState(initialScopeDate);
  const [scopeMonth, setScopeMonth] = useState(initialScopeDate.slice(0, 7));
  const [scopeStartDate, setScopeStartDate] = useState(initialScopeDate);
  const [scopeEndDate, setScopeEndDate] = useState(initialScopeDate);
  const [scopeTicker, setScopeTicker] = useState("");

  const analysisScope = useMemo<CoachAiChatAnalysisScope | null>(() => {
    if (analysisKind === "all") return Object.freeze({ kind: "all" });
    if (analysisKind === "recent") return Object.freeze({ kind: "recent" });
    if (analysisKind === "day") return Object.freeze({ kind: "day", date: scopeDate });
    if (analysisKind === "week") return Object.freeze({ kind: "week", anchorDate: scopeDate });
    if (analysisKind === "month") return Object.freeze({ kind: "month", month: scopeMonth });
    if (analysisKind === "custom") {
      return scopeStartDate <= scopeEndDate
        ? Object.freeze({ kind: "custom", startDate: scopeStartDate, endDate: scopeEndDate })
        : null;
    }
    const ticker = scopeTicker.trim().toUpperCase();
    return /^[A-Z0-9.\-]{1,32}$/u.test(ticker)
      ? Object.freeze({ kind: "ticker", ticker })
      : null;
  }, [analysisKind, scopeDate, scopeEndDate, scopeMonth, scopeStartDate, scopeTicker]);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const evidenceByMessageId = useMemo(
    () => new Map(messageEvidence.map((item) => [item.messageId, item.cards])),
    [messageEvidence],
  );
  const hasPendingAssistantMessage = useMemo(
    () => messages.some((message) => message.role === "assistant" && message.generationState === "pending"),
    [messages],
  );

  const loadConversations = useCallback(async (append = false, cursor: string | null = null) => {
    setLoadingConversations(true);
    setNotice(null);
    try {
      const query = new URLSearchParams({ state: archived ? "archived" : "active", limit: "30" });
      if (activeConversationSearch) query.set("search", activeConversationSearch);
      if (cursor) query.set("cursor", cursor);
      const response = await readJson<ConversationResponse>(await fetch(`${conversationsEndpoint}?${query}`, { cache: "no-store" }));
      setConversations((current) => append ? [...current, ...response.conversations] : response.conversations);
      setConversationCursor(response.nextCursor);
      if (!append) {
        setActiveConversationId((current) => {
          if (dailyContext && dailyContextConversationIdRef.current === null) return null;
          return response.conversations.some((item) => item.conversationId === current)
            ? current
            : response.conversations[0]?.conversationId ?? null;
        });
      }
    } catch {
      setNotice("Conversations could not be loaded right now.");
    } finally {
      setLoadingConversations(false);
    }
  }, [activeConversationSearch, archived, dailyContext]);

  useEffect(() => {
    let active = true;
    void (async () => readJson<ReadinessResponse>(await fetch(
      "/api/coach/chat/readiness",
      { cache: "no-store" },
    )))()
      .then((response) => { if (active) setReadiness(response.readiness.state); })
      .catch(() => { if (active) setReadiness("unavailable"); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => readJson<RelationshipMemoryResponse>(await fetch(
      relationshipMemoryEndpoint,
      { cache: "no-store" },
    )))()
      .then((response) => { if (active) setMeetLinksCandidate(response.memory); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!loadingConversations && conversations.length === 0 &&
        meetLinksCandidate?.settings.meetLinksState === "not_started") {
      setMeetLinksOpen(true);
    }
  }, [conversations.length, loadingConversations, meetLinksCandidate]);

  const loadMessages = useCallback(async (conversationId: string, appendOlder = false, cursor: string | null = null) => {
    setLoadingMessages(true);
    setNotice(null);
    try {
      const query = new URLSearchParams({ limit: "100" });
      if (cursor) query.set("cursor", cursor);
      const response = await readJson<MessageResponse>(await fetch(`${conversationsEndpoint}/${conversationId}/messages?${query}`, { cache: "no-store" }));
      setMessages((current) => appendOlder ? [...response.messages, ...current] : response.messages);
      setMessageEvidence((current) => {
        if (!appendOlder) return response.evidence;
        const byMessageId = new Map(current.map((item) => [item.messageId, item]));
        for (const item of response.evidence) byMessageId.set(item.messageId, item);
        return Object.freeze([...byMessageId.values()]);
      });
      setMessageCursor(response.nextCursor);
    } catch {
      if (!appendOlder) {
        setMessages([]);
        setMessageEvidence([]);
      }
      setNotice("This conversation could not be loaded right now.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadManualEntryDrafts = useCallback(async (conversationId: string) => {
    try {
      const response = await readJson<ManualEntryDraftResponse>(await fetch(
        `${conversationsEndpoint}/${conversationId}/manual-entry-drafts`,
        { cache: "no-store" },
      ));
      setManualEntryDrafts(response.drafts);
    } catch {
      setManualEntryDrafts([]);
      setNotice("Execution drafts could not be loaded right now.");
    }
  }, []);

  const loadDailyCompanionDrafts = useCallback(async (conversationId: string) => {
    try {
      const response = await readJson<DailyCompanionDraftResponse>(await fetch(
        `${conversationsEndpoint}/${conversationId}/daily-companion-drafts`,
        { cache: "no-store" },
      ));
      setDailyCompanionDrafts(response.drafts);
    } catch {
      setDailyCompanionDrafts([]);
      setNotice("Daily note drafts could not be loaded right now.");
    }
  }, []);

  const loadReviewDeliveryChangeDrafts = useCallback(async (conversationId: string) => {
    try {
      const response = await readJson<ReviewDeliveryChangeDraftResponse>(await fetch(
        `${conversationsEndpoint}/${conversationId}/review-delivery-change-drafts`,
        { cache: "no-store" },
      ));
      setReviewDeliveryChangeDrafts(response.drafts);
    } catch {
      setReviewDeliveryChangeDrafts([]);
      setNotice("AI Review delivery changes could not be loaded right now.");
    }
  }, []);

  const loadActionDrafts = useCallback(async (conversationId: string) => {
    try {
      const response = await readJson<ActionDraftResponse>(await fetch(
        `${conversationsEndpoint}/${conversationId}/action-drafts`,
        { cache: "no-store" },
      ));
      setActionDrafts(response.drafts);
    } catch {
      setActionDrafts([]);
      setNotice("Proposed changes could not be loaded right now.");
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveConversationSearch(conversationSearch.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [conversationSearch]);
  const appliedContextRequestIdRef = useRef(contextRequestId);
  useEffect(() => {
    if (contextRequestId === 0 || appliedContextRequestIdRef.current === contextRequestId) return;
    appliedContextRequestIdRef.current = contextRequestId;
    dailyContextConversationIdRef.current = null;
    setArchived(false);
    setDailyContext(initialContext);
    if (initialContext) {
      setAnalysisKind("day");
      setScopeDate(initialContext.tradingDate);
    }
    if (initialQuestion?.trim()) setQuestion(initialQuestion.trim());
    if (initialContext) setActiveConversationId(null);
  }, [contextRequestId, initialContext, initialQuestion]);
  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (activeConversationId) {
      void loadMessages(activeConversationId);
      void loadManualEntryDrafts(activeConversationId);
      void loadDailyCompanionDrafts(activeConversationId);
      void loadReviewDeliveryChangeDrafts(activeConversationId);
      void loadActionDrafts(activeConversationId);
    }
    else {
      setMessages([]);
      setMessageEvidence([]);
      setManualEntryDrafts([]);
      setDailyCompanionDrafts([]);
      setReviewDeliveryChangeDrafts([]);
      setActionDrafts([]);
      setMessageCursor(null);
    }
  }, [activeConversationId, loadActionDrafts, loadDailyCompanionDrafts, loadManualEntryDrafts, loadMessages, loadReviewDeliveryChangeDrafts]);
  useEffect(() => {
    if (!activeConversationId || !hasPendingAssistantMessage) return undefined;
    const interval = window.setInterval(() => {
      void Promise.all([
        loadMessages(activeConversationId),
        loadManualEntryDrafts(activeConversationId),
        loadDailyCompanionDrafts(activeConversationId),
        loadReviewDeliveryChangeDrafts(activeConversationId),
        loadActionDrafts(activeConversationId),
      ]);
    }, 12_000);
    return () => window.clearInterval(interval);
  }, [activeConversationId, hasPendingAssistantMessage, loadActionDrafts,
    loadDailyCompanionDrafts, loadManualEntryDrafts, loadMessages,
    loadReviewDeliveryChangeDrafts]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function createConversation(): Promise<CoachAiChatConversation | null> {
    if (readiness !== "ready") {
      setNotice("Links AI Chat is not available yet. Your conversations are still saved.");
      return null;
    }
    setNotice(null);
    try {
      const response = await readJson<Readonly<{ status: "ready"; conversation: CoachAiChatConversation }>>(await fetch(conversationsEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: dailyContext
            ? `${dailyContext.tradingDate} daily review`
            : "New conversation",
        }),
      }));
      setConversationSearch("");
      setActiveConversationSearch("");
      setArchived(false);
      setConversations((current) => [response.conversation, ...current]);
      if (dailyContext) {
        dailyContextConversationIdRef.current = response.conversation.conversationId;
      }
      setActiveConversationId(response.conversation.conversationId);
      setMobileOpen(false);
      return response.conversation;
    } catch {
      setNotice("A new conversation could not be started right now.");
      return null;
    }
  }

  async function sendQuestion(questionOverride?: string): Promise<void> {
    const text = (questionOverride ?? question).trim();
    if (!text || sending || hasPendingAssistantMessage) return;
    const rememberRequest = directMemoryRequest(text);
    if (rememberRequest) {
      if (meetLinksCandidate?.settings.enabled === false) {
        setNotice("Relationship memory is off. Open What Links remembers to turn it back on.");
        return;
      }
      const conversation = activeConversation?.state === "active" ? activeConversation : null;
      setSending(true);
      setNotice(null);
      try {
        const rememberResponse = await readJson<Readonly<{
          status: "ready";
          conversation: CoachAiChatConversation;
        }>>(await fetch("/api/coach/chat/remember", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            originalQuestion: text,
            memoryText: rememberRequest.memoryText,
            category: rememberRequest.category,
            scopeKind: rememberRequest.scopeKind,
            conversationId: conversation?.conversationId ?? null,
            conversationTitle: "Remembered with Links",
          }),
        }));
        setQuestion("");
        setActiveConversationId(rememberResponse.conversation.conversationId);
        await Promise.all([
          loadMessages(rememberResponse.conversation.conversationId),
          loadConversations(),
          (async () => {
            const response = await readJson<RelationshipMemoryResponse>(await fetch(
              relationshipMemoryEndpoint,
              { cache: "no-store" },
            ));
            setMeetLinksCandidate(response.memory);
          })(),
        ]);
      } catch {
        setNotice("Links could not remember that right now. Your message was not saved.");
      } finally {
        setSending(false);
      }
      return;
    }
    if (readiness !== "ready") {
      setNotice("Links AI Chat is not available yet. Your conversations are still saved.");
      return;
    }
    if (!analysisScope) {
      setNotice(analysisKind === "ticker"
        ? "Enter a ticker before sending your question."
        : "Choose a valid date range before sending your question.");
      return;
    }
    let conversation = activeConversation;
    if (!conversation || conversation.state !== "active") conversation = await createConversation();
    if (!conversation) return;
    setQuestion("");
    setSending(true);
    setNotice(null);
    // Trade entry is recognized from the trader's words. The visible shortcut
    // only changes helpful UI copy; it is never required before entering rows.
    const intent = "answer_question";
    const submittedPagePathname = pathname;
    const contextKey = JSON.stringify({
      intent,
      analysisScope,
      dailyContext,
      pagePathname: submittedPagePathname,
    });
    const clientRequestId = retryRequest?.conversationId === conversation.conversationId &&
        retryRequest.question === text && retryRequest.contextKey === contextKey
      ? retryRequest.clientRequestId
      : crypto.randomUUID();
    setRetryRequest(Object.freeze({
      conversationId: conversation.conversationId,
      question: text,
      clientRequestId,
      contextKey,
    }));
    setMessages((current) => [...current, {
      messageId: `local-${crypto.randomUUID()}`,
      sequence: Number.MAX_SAFE_INTEGER,
      role: "user",
      originalUserTextPrivate: text,
      normalizedUserTextPrivate: null,
      structuredInterpretationJson: null,
      assistantTextPrivate: null,
      generationState: "not_applicable",
      failureCode: null,
      createdAtUtc: new Date().toISOString(),
      finalizedAtUtc: null,
    }]);
    try {
      const response = await fetch(`${conversationsEndpoint}/${conversation.conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: text,
          clientRequestId,
          intent,
          analysisScope,
          pagePathname: submittedPagePathname,
          ...(dailyContext ? { context: dailyContext } : {}),
        }),
      });
      const body = await response.json() as Partial<GenerationResponse>;
      if (!(["completed", "pending", "blocked", "failed"] as const).includes(body.status as GenerationResponse["status"]) ||
          typeof body.assistantMessageId !== "string") throw new Error("request_failed");
      setRetryRequest(null);
      if (body.manualEntryDraft) {
        setManualEntryDrafts((current) => [
          body.manualEntryDraft!,
          ...current.filter((draft) => draft.draftId !== body.manualEntryDraft!.draftId),
        ]);
      }
      if (body.dailyCompanionDraft) {
        setDailyCompanionDrafts((current) => [
          body.dailyCompanionDraft!,
          ...current.filter((draft) =>
            draft.interactionId !== body.dailyCompanionDraft!.interactionId),
        ]);
      }
      if (body.reviewDeliveryChangeDraft) {
        setReviewDeliveryChangeDrafts((current) => [
          body.reviewDeliveryChangeDraft!,
          ...current.filter((draft) =>
            draft.draftId !== body.reviewDeliveryChangeDraft!.draftId),
        ]);
      }
      if (body.actionDraft) {
        setActionDrafts((current) => [
          body.actionDraft!,
          ...current.filter((draft) => draft.draftId !== body.actionDraft!.draftId),
        ]);
      }
      await loadMessages(conversation.conversationId);
      await loadConversations();
      if (body.status === "blocked") setNotice("Today’s Links AI Chat limit has been reached. Your question is saved, and you can return later.");
      else if (body.status === "failed") setNotice("The answer could not be completed. Your question is saved, and you can try again later.");
    } catch {
      await loadMessages(conversation.conversationId);
      setQuestion(text);
      setNotice("The question could not be sent right now. Try again when you’re ready.");
    } finally {
      setSending(false);
    }
  }

  async function flagAnswer(messageId: string): Promise<void> {
    if (!activeConversation || flaggedAnswerIds.has(messageId)) return;
    try {
      await readJson<QualityFeedbackResponse>(await fetch(
        `${conversationsEndpoint}/${activeConversation.conversationId}/messages/${messageId}/quality-feedback`,
        { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
      ));
      setFlaggedAnswerIds((current) => new Set([...current, messageId]));
    } catch {
      setNotice("That answer could not be flagged right now. Please try again.");
    }
  }

  function openMemory(): void {
    savedScrollTopRef.current = messageScrollRef.current?.scrollTop ?? 0;
    setMemoryOpen(true);
  }

  function closeMemory(promptStarter?: string): void {
    if (promptStarter) setQuestion(promptStarter);
    setMemoryOpen(false);
    window.requestAnimationFrame(() => {
      if (messageScrollRef.current) messageScrollRef.current.scrollTop = savedScrollTopRef.current;
    });
  }

  async function saveRename(): Promise<void> {
    if (!activeConversation || renameTitle.trim().length === 0) return;
    try {
      const response = await readJson<Readonly<{ status: "ready"; conversation: CoachAiChatConversation }>>(await fetch(`${conversationsEndpoint}/${activeConversation.conversationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "rename", title: renameTitle.trim() }),
      }));
      setConversations((current) => current.map((item) => item.conversationId === response.conversation.conversationId ? response.conversation : item));
      setRenaming(false);
    } catch {
      setNotice("The conversation name could not be changed right now.");
    }
  }

  async function changeArchiveState(): Promise<void> {
    if (!activeConversation) return;
    try {
      await readJson(await fetch(`${conversationsEndpoint}/${activeConversation.conversationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: activeConversation.state === "active" ? "archive" : "restore" }),
      }));
      if (dailyContextConversationIdRef.current === activeConversation.conversationId) {
        dailyContextConversationIdRef.current = null;
        setDailyContext(null);
      }
      setActiveConversationId(null);
      await loadConversations();
    } catch {
      setNotice("The conversation could not be updated right now.");
    }
  }

  const list = (
    <ConversationList
      activeConversationId={activeConversationId}
      archived={archived}
      conversations={conversations}
      loading={loadingConversations}
      nextCursor={conversationCursor}
      onLoadMore={() => void loadConversations(true, conversationCursor)}
      onNew={() => void createConversation()}
      onSearchChange={setConversationSearch}
      onSelect={(conversationId) => {
        if (dailyContextConversationIdRef.current !== conversationId) {
          dailyContextConversationIdRef.current = null;
          setDailyContext(null);
        }
        setActiveConversationId(conversationId);
        setMobileOpen(false);
      }}
      onToggleArchived={() => {
        dailyContextConversationIdRef.current = null;
        setDailyContext(null);
        setArchived((value) => !value);
        setActiveConversationId(null);
      }}
      search={conversationSearch}
    />
  );

  return (
    <Paper
      sx={{
        border: drawerPresentation ? 0 : 1,
        borderColor: "divider",
        borderRadius: drawerPresentation ? 0 : 2,
        display: "flex",
        height: drawerPresentation ? "100%" : { xs: "calc(100dvh - 230px)", md: 680 },
        minHeight: drawerPresentation ? 0 : 520,
        overflow: "hidden",
        position: "relative",
      }}
      variant="outlined"
    >
      {!mobile && !meetLinksOpen ? <Box sx={{ borderRight: 1, borderColor: "divider", flex: "0 0 288px", minWidth: 0 }}>{list}</Box> : null}
      {mobile && mobileOpen ? (
        <Box
          sx={{
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            inset: 0,
            position: "absolute",
            zIndex: 2,
          }}
        >
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              borderBottom: 1,
              borderColor: "divider",
              justifyContent: "space-between",
              px: 1.5,
              py: 1,
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>Conversations</Typography>
            <IconButton aria-label="Close conversations" onClick={() => setMobileOpen(false)} sx={{ height: 44, width: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>{list}</Box>
        </Box>
      ) : null}

      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", minHeight: 64, px: { xs: 1.25, sm: 2 } }}>
          {memoryOpen ? (
            <IconButton aria-label="Back to chat" onClick={() => closeMemory()} sx={{ height: 44, width: 44 }}>
              <ArrowBackRoundedIcon />
            </IconButton>
          ) : mobile ? <IconButton aria-label="Open conversations" onClick={() => setMobileOpen(true)} sx={{ height: 44, width: 44 }}><MenuRoundedIcon /></IconButton> : null}
          {!memoryOpen ? <LinksAvatar /> : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {memoryOpen ? (
              <Typography component="h2" noWrap sx={{ fontWeight: 800 }} variant="subtitle1">What Links remembers</Typography>
            ) : meetLinksOpen ? (
              <Box>
                <Typography noWrap sx={{ fontWeight: 800 }}>Links · Meet Links</Typography>
                <Typography color="text.secondary" variant="caption">Your TradersLink AI assistant</Typography>
              </Box>
            ) : renaming ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField autoFocus fullWidth onChange={(event) => setRenameTitle(event.target.value)} size="small" value={renameTitle} />
                <Button onClick={() => void saveRename()} size="small">Save</Button>
              </Stack>
            ) : (
              <>
                {drawerPresentation ? (
                  <Typography color="text.secondary" variant="caption">
                    Links AI Chat
                  </Typography>
                ) : null}
                <Typography noWrap sx={{ fontWeight: 800 }}>
                  {activeConversation?.title ?? "Links"}
                </Typography>
              </>
            )}
          </Box>
          {activeConversation && !renaming && !memoryOpen && !meetLinksOpen ? (
            <>
              <Tooltip title="Rename conversation"><IconButton aria-label="Rename conversation" onClick={() => { setRenameTitle(activeConversation.title); setRenaming(true); }} sx={{ height: 44, width: 44 }}><EditRoundedIcon /></IconButton></Tooltip>
              <Tooltip title={activeConversation.state === "active" ? "Archive conversation" : "Restore conversation"}><IconButton aria-label={activeConversation.state === "active" ? "Archive conversation" : "Restore conversation"} onClick={() => void changeArchiveState()} sx={{ height: 44, width: 44 }}>{activeConversation.state === "active" ? <ArchiveRoundedIcon /> : <RestoreRoundedIcon />}</IconButton></Tooltip>
            </>
          ) : null}
          {!memoryOpen && !meetLinksOpen ? (
            <Tooltip title="What Links remembers">
              <IconButton aria-label="What Links remembers" onClick={openMemory} sx={{ height: 44, width: 44 }}>
                <BookmarkBorderRoundedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          {onClose ? (
            <Tooltip title="Close Links AI Chat">
              <IconButton aria-label="Close Links AI Chat" onClick={() => meetLinksOpen && meetLinksDirty ? setMeetLinksLeaveOpen(true) : onClose()} sx={{ height: 44, width: 44 }}>
                <CloseRoundedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>

        {meetLinksOpen && meetLinksCandidate ? (
          <MeetLinksFlow
            account={meetLinksCandidate.currentAccount}
            onComplete={(memory) => {
              setMeetLinksCandidate(memory);
              setMeetLinksDirty(false);
              setMeetLinksOpen(false);
            }}
            onDirtyChange={setMeetLinksDirty}
          />
        ) : memoryOpen ? (
          <RelationshipMemoryScreen
            onBack={() => closeMemory()}
            onTellLinks={() => closeMemory("Remember that ")}
          />
        ) : (
          <>
        {dailyContext ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              bgcolor: "#EAF2FF",
              borderBottom: 1,
              borderColor: "#C8DAF7",
              px: { xs: 1.5, sm: 2 },
              py: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography color="primary.main" sx={{ fontWeight: 850 }} variant="body2">
                Daily Trade Tracker · {dailyContext.tradingDate}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Your questions will use the saved trades, notes, tags, rules and focuses from this day.
              </Typography>
            </Box>
            <IconButton
              aria-label="Stop using this trading day"
              onClick={() => {
                dailyContextConversationIdRef.current = null;
                setDailyContext(null);
              }}
              size="small"
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : null}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { sm: "center" },
            borderBottom: 1,
            borderColor: "divider",
            px: { xs: 1.5, sm: 2 },
            py: 1,
          }}
        >
          <Typography sx={{ flexShrink: 0, fontWeight: 800 }} variant="body2">
            Explore
          </Typography>
          <TextField
            onChange={(event) => setAnalysisKind(event.target.value as CoachAiChatAnalysisScope["kind"])}
            select
            size="small"
            value={analysisKind}
          >
              <MenuItem value="all">All trading history</MenuItem>
              <MenuItem value="recent">Recent 90 days</MenuItem>
            <MenuItem value="day">One day</MenuItem>
            <MenuItem value="week">One week</MenuItem>
            <MenuItem value="month">One month</MenuItem>
            <MenuItem value="custom">Custom dates</MenuItem>
            <MenuItem value="ticker">One ticker</MenuItem>
          </TextField>
          {analysisKind === "day" || analysisKind === "week" ? (
            <TextField
              label={analysisKind === "day" ? "Trading day" : "A day in the week"}
              onChange={(event) => setScopeDate(event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="date"
              value={scopeDate}
            />
          ) : null}
          {analysisKind === "month" ? (
            <TextField
              label="Month"
              onChange={(event) => setScopeMonth(event.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              type="month"
              value={scopeMonth}
            />
          ) : null}
          {analysisKind === "custom" ? (
            <>
              <TextField
                label="From"
                onChange={(event) => setScopeStartDate(event.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={scopeStartDate}
              />
              <TextField
                label="To"
                onChange={(event) => setScopeEndDate(event.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={scopeEndDate}
              />
            </>
          ) : null}
          {analysisKind === "ticker" ? (
            <TextField
              label="Ticker"
              onChange={(event) => setScopeTicker(event.target.value.toUpperCase())}
              size="small"
              value={scopeTicker}
            />
          ) : null}
        </Stack>

        {notice ? <Alert onClose={() => setNotice(null)} severity="info" sx={{ borderRadius: 0 }}>{notice}</Alert> : null}
        {readiness === "unavailable" ? (
          <Alert severity="info" sx={{ borderRadius: 0 }}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Links AI Chat is not available yet</Typography>
            <Typography variant="body2">Your conversations are saved, but new answers are not available yet.</Typography>
          </Alert>
        ) : null}
        <Box ref={messageScrollRef} sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 1.5, sm: 3 }, py: 2 }}>
          {messageCursor ? <Button onClick={() => activeConversationId && void loadMessages(activeConversationId, true, messageCursor)} size="small" sx={{ display: "block", mx: "auto", mb: 2 }}>Load earlier messages</Button> : null}
          {loadingMessages && messages.length === 0 ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", py: 6 }}><CircularProgress size={22} /><Typography color="text.secondary">Loading conversation...</Typography></Stack> : null}
          {!loadingMessages && activeConversation && messages.length === 0 ? (
            <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center", minHeight: "100%", textAlign: "center" }}>
              <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 42 }} />
              <Typography sx={{ fontWeight: 800 }} variant="h3">What would you like to explore?</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520 }} variant="body2">Ask about completed trades, results, timing, tickers, or patterns in the trading record saved to this Trade Tracker account.</Typography>
            </Stack>
          ) : null}
          {!activeConversation && !loadingConversations ? (
            <LinksFirstImpression
              disabled={readiness !== "ready"}
              onAsk={(suggestion) => void sendQuestion(suggestion)}
              onMemory={() => setMemoryInfoOpen(true)}
            />
          ) : null}
          <Stack spacing={1.5}>
            {messages.map((message) => {
              const user = message.role === "user";
              const text = user
                ? message.originalUserTextPrivate
                : message.assistantTextPrivate === null
                  ? null
                  : formatCoachAiMoneyForDisplay(message.assistantTextPrivate);
              if (!text && message.generationState !== "pending" && message.generationState !== "failed") return null;
              return (
                <Stack key={message.messageId} sx={{ alignSelf: user ? "flex-end" : "flex-start", maxWidth: { xs: "92%", sm: "78%" }, width: "100%" }}>
                  <Box sx={{ alignSelf: user ? "flex-end" : "flex-start", bgcolor: user ? "primary.main" : "#EEF4FF", borderRadius: 2, color: user ? "primary.contrastText" : "text.primary", px: 2, py: 1.5 }}>
                    {!user ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: message.generationState === "completed" ? 0.75 : 0 }}><LinksAvatar size={24} /><Typography sx={{ fontWeight: 800 }} variant="caption">Links</Typography></Stack> : null}
                    {message.generationState === "pending" ? <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><CircularProgress size={16} /><Typography variant="body2">Links is thinking…</Typography></Stack>
                      : message.generationState === "failed" ? <Typography variant="body2">{message.failureCode === "TRADERLINK_COACH_CHAT_DAILY_CAP_REACHED"
                        ? "Today’s Links AI Chat limit has been reached. Your question is saved, and you can return later."
                        : "Links couldn’t finish that answer. Your question is saved, and you can try again."}</Typography>
                        : <Typography sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }} variant="body2">{text}</Typography>}
                  </Box>
                  {!user && message.generationState === "completed" ? (
                    <Button
                      disabled={flaggedAnswerIds.has(message.messageId)}
                      onClick={() => void flagAnswer(message.messageId)}
                      size="small"
                      sx={{ alignSelf: "flex-start", fontSize: 11, minWidth: 0, mt: 0.25, px: 0.5 }}
                    >
                      {flaggedAnswerIds.has(message.messageId) ? "Flagged" : "Not helpful"}
                    </Button>
                  ) : null}
                  {!user && message.generationState === "completed" ? (
                    <EvidenceCards cards={evidenceByMessageId.get(message.messageId) ?? []} />
                  ) : null}
                </Stack>
              );
            })}
            {manualEntryDrafts
              .filter((draft) => draft.state !== "archived" && draft.state !== "expired")
              .slice(0, 1)
              .map((draft) => (
                <AiChatManualEntryCard
                  conversationId={draft.conversationId}
                  draft={draft}
                  key={draft.draftId}
                  onDraftChange={(updatedDraft) => setManualEntryDrafts((current) => [
                    updatedDraft,
                    ...current.filter((item) => item.draftId !== updatedDraft.draftId),
                  ])}
                />
              ))}
            {dailyCompanionDrafts
              .filter((draft) => draft.disposition !== "rejected" && draft.disposition !== "expired")
              .slice(0, 3)
              .map((draft) => (
                <AiChatDailyCompanionCard
                  conversationId={draft.conversationId}
                  draft={draft}
                  key={draft.interactionId}
                  onDraftChange={(updatedDraft) => setDailyCompanionDrafts((current) => [
                    updatedDraft,
                    ...current.filter((item) =>
                      item.interactionId !== updatedDraft.interactionId),
                  ])}
                />
              ))}
            {reviewDeliveryChangeDrafts
              .filter((draft) => draft.disposition !== "rejected" && draft.disposition !== "expired")
              .slice(0, 1)
              .map((draft) => (
                <AiChatReviewDeliveryChangeCard
                  conversationId={draft.conversationId}
                  draft={draft}
                  key={draft.draftId}
                  onDraftChange={(updatedDraft) => setReviewDeliveryChangeDrafts((current) => [
                    updatedDraft,
                    ...current.filter((item) => item.draftId !== updatedDraft.draftId),
                  ])}
                />
              ))}
            {actionDrafts
              .filter((draft) => draft.disposition !== "rejected" && draft.disposition !== "expired")
              .slice(0, 1)
              .map((draft) => (
                <AiChatActionDraftCard
                  conversationId={draft.conversationId}
                  draft={draft}
                  key={draft.draftId}
                  onDraftChange={(updatedDraft) => setActionDrafts((current) => [
                    updatedDraft,
                    ...current.filter((item) => item.draftId !== updatedDraft.draftId),
                  ])}
                />
              ))}
            {sending ? <Box sx={{ alignSelf: "flex-start", bgcolor: "#EEF4FF", borderRadius: 2, px: 2, py: 1.5 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><LinksAvatar size={24} /><CircularProgress size={16} /><Typography variant="body2">Links is thinking…</Typography></Stack></Box> : null}
            <div ref={endRef} />
          </Stack>
        </Box>

        <Box
          sx={{
            borderTop: 1,
            borderColor: "divider",
            pb: { xs: "calc(10px + env(safe-area-inset-bottom))", sm: 2 },
            px: { xs: 1.25, sm: 2 },
            pt: { xs: 1.25, sm: 2 },
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "flex-end" } }}>
            <TextField
              disabled={readiness !== "ready" || sending || hasPendingAssistantMessage ||
                (activeConversation !== null && activeConversation.state !== "active")}
              fullWidth
              maxRows={6}
              minRows={2}
              multiline
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuestion();
                }
              }}
              placeholder={dailyContext ? "Ask Links about this trading day…" : "Ask Links about your trading…"}
              value={question}
            />
            <IconButton aria-label="Send question" color="primary" disabled={readiness !== "ready" || !question.trim() || sending || hasPendingAssistantMessage || !analysisScope} onClick={() => void sendQuestion()} sx={{ alignSelf: { xs: "flex-end", sm: "auto" }, height: 48, width: 48 }}><SendRoundedIcon /></IconButton>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">
            {hasPendingAssistantMessage ? "Your last question is still being completed." : "Press Enter to send. Use Shift + Enter for a new line."}
          </Typography>
        </Box>
          </>
        )}
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={() => setMemoryInfoOpen(false)} open={memoryInfoOpen}>
        <DialogTitle>How Links remembers</DialogTitle>
        <DialogContent>
          <Typography>Links remembers only what you ask or approve. Memories help future conversations, but they never replace current trading data. You can review, change, turn off or forget them anytime.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMemoryInfoOpen(false); openMemory(); }}>What Links remembers</Button>
          <Button onClick={() => setMemoryInfoOpen(false)} variant="contained">Got it</Button>
        </DialogActions>
      </Dialog>
      <Dialog fullWidth maxWidth="sm" onClose={() => setMeetLinksLeaveOpen(false)} open={meetLinksLeaveOpen}>
        <DialogTitle>Leave Meet Links?</DialogTitle>
        <DialogContent><Typography>Your answers haven’t been saved and will be cleared.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetLinksLeaveOpen(false)}>Keep going</Button>
          <Button color="error" onClick={() => { setMeetLinksLeaveOpen(false); setMeetLinksDirty(false); onClose?.(); }}>Leave without saving</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
