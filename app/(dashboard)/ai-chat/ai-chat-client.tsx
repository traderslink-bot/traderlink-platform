"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  CoachAiChatConversation,
  CoachAiChatMessage,
} from "@/src/modules/coach/contracts/ai-chat-contracts";
import type { CoachAiDailyCompanionContextSelector } from "@/src/modules/coach/contracts/ai-daily-companion-contracts";

type ConversationResponse = Readonly<{
  status: "ready";
  conversations: readonly CoachAiChatConversation[];
  nextCursor: string | null;
}>;

type MessageResponse = Readonly<{
  status: "ready";
  conversationId: string;
  messages: readonly CoachAiChatMessage[];
  nextCursor: string | null;
}>;

type GenerationResponse = Readonly<{
  status: "completed" | "pending" | "blocked" | "failed";
  assistantMessageId: string;
}>;

type RetryRequest = Readonly<{
  conversationId: string;
  question: string;
  clientRequestId: string;
  contextKey: string;
}>;

const conversationsEndpoint = "/api/coach/chat/conversations";

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

async function readJson<T>(response: Response): Promise<T> {
  const value = await response.json() as unknown;
  if (!response.ok || typeof value !== "object" || value === null) throw new Error("request_failed");
  return value as T;
}

function ConversationList({
  activeConversationId,
  archived,
  conversations,
  loading,
  nextCursor,
  onLoadMore,
  onNew,
  onSelect,
  onToggleArchived,
}: Readonly<{
  activeConversationId: string | null;
  archived: boolean;
  conversations: readonly CoachAiChatConversation[];
  loading: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onToggleArchived: () => void;
}>) {
  return (
    <Stack sx={{ height: "100%" }}>
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <Button fullWidth onClick={onNew} startIcon={<AddRoundedIcon />} variant="contained">New conversation</Button>
        <Button onClick={onToggleArchived} size="small" startIcon={archived ? <ChatBubbleOutlineRoundedIcon /> : <ArchiveRoundedIcon />} variant="text">
          {archived ? "Active conversations" : "Archived conversations"}
        </Button>
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
              {archived ? "No archived conversations." : "No conversations yet."}
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
}: Readonly<{
  initialContext?: CoachAiDailyCompanionContextSelector | null;
}>) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("md"));
  const endRef = useRef<HTMLDivElement | null>(null);
  const dailyContextConversationIdRef = useRef<string | null>(null);
  const [archived, setArchived] = useState(false);
  const [conversations, setConversations] = useState<readonly CoachAiChatConversation[]>([]);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly CoachAiChatMessage[]>([]);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);
  const [dailyContext, setDailyContext] = useState(initialContext);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const loadConversations = useCallback(async (append = false, cursor: string | null = null) => {
    setLoadingConversations(true);
    setNotice(null);
    try {
      const query = new URLSearchParams({ state: archived ? "archived" : "active", limit: "30" });
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
  }, [archived, dailyContext]);

  const loadMessages = useCallback(async (conversationId: string, appendOlder = false, cursor: string | null = null) => {
    setLoadingMessages(true);
    setNotice(null);
    try {
      const query = new URLSearchParams({ limit: "100" });
      if (cursor) query.set("cursor", cursor);
      const response = await readJson<MessageResponse>(await fetch(`${conversationsEndpoint}/${conversationId}/messages?${query}`, { cache: "no-store" }));
      setMessages((current) => appendOlder ? [...response.messages, ...current] : response.messages);
      setMessageCursor(response.nextCursor);
    } catch {
      if (!appendOlder) setMessages([]);
      setNotice("This conversation could not be loaded right now.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (activeConversationId) void loadMessages(activeConversationId);
    else {
      setMessages([]);
      setMessageCursor(null);
    }
  }, [activeConversationId, loadMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function createConversation(): Promise<CoachAiChatConversation | null> {
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

  async function sendQuestion(): Promise<void> {
    const text = question.trim();
    if (!text || sending) return;
    let conversation = activeConversation;
    if (!conversation || conversation.state !== "active") conversation = await createConversation();
    if (!conversation) return;
    setQuestion("");
    setSending(true);
    setNotice(null);
    const contextKey = dailyContext
      ? `${dailyContext.kind}:${dailyContext.tradingDate}:${dailyContext.currency}`
      : "none";
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
          ...(dailyContext ? { context: dailyContext } : {}),
        }),
      });
      const body = await response.json() as Partial<GenerationResponse>;
      if (!(["completed", "pending", "blocked", "failed"] as const).includes(body.status as GenerationResponse["status"]) ||
          typeof body.assistantMessageId !== "string") throw new Error("request_failed");
      setRetryRequest(null);
      await loadMessages(conversation.conversationId);
      await loadConversations();
      if (body.status === "blocked") setNotice("Today’s AI Chat limit has been reached. Your question is saved, and you can return later.");
      else if (body.status === "failed") setNotice("The answer could not be completed. Your question is saved, and you can try again later.");
    } catch {
      await loadMessages(conversation.conversationId);
      setQuestion(text);
      setNotice("The question could not be sent right now. Try again when you’re ready.");
    } finally {
      setSending(false);
    }
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
    />
  );

  return (
    <Paper sx={{ border: 1, borderColor: "divider", borderRadius: 2, display: "flex", height: { xs: "calc(100dvh - 230px)", md: 680 }, minHeight: 520, overflow: "hidden" }} variant="outlined">
      {!mobile ? <Box sx={{ borderRight: 1, borderColor: "divider", flex: "0 0 288px", minWidth: 0 }}>{list}</Box> : null}
      <Drawer anchor="left" onClose={() => setMobileOpen(false)} open={mobile && mobileOpen} slotProps={{ paper: { sx: { width: "min(88vw, 320px)" } } }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", px: 2, pt: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>Conversations</Typography>
          <IconButton aria-label="Close conversations" onClick={() => setMobileOpen(false)}><CloseRoundedIcon /></IconButton>
        </Stack>
        {list}
      </Drawer>

      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", minHeight: 64, px: { xs: 1.25, sm: 2 } }}>
          {mobile ? <IconButton aria-label="Open conversations" onClick={() => setMobileOpen(true)}><MenuRoundedIcon /></IconButton> : null}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {renaming ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField autoFocus fullWidth onChange={(event) => setRenameTitle(event.target.value)} size="small" value={renameTitle} />
                <Button onClick={() => void saveRename()} size="small">Save</Button>
              </Stack>
            ) : <Typography noWrap sx={{ fontWeight: 800 }}>{activeConversation?.title ?? "Choose a conversation"}</Typography>}
          </Box>
          {activeConversation && !renaming ? (
            <>
              <Tooltip title="Rename conversation"><IconButton aria-label="Rename conversation" onClick={() => { setRenameTitle(activeConversation.title); setRenaming(true); }}><EditRoundedIcon /></IconButton></Tooltip>
              <Tooltip title={activeConversation.state === "active" ? "Archive conversation" : "Restore conversation"}><IconButton aria-label={activeConversation.state === "active" ? "Archive conversation" : "Restore conversation"} onClick={() => void changeArchiveState()}>{activeConversation.state === "active" ? <ArchiveRoundedIcon /> : <RestoreRoundedIcon />}</IconButton></Tooltip>
            </>
          ) : null}
        </Stack>

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

        {notice ? <Alert onClose={() => setNotice(null)} severity="info" sx={{ borderRadius: 0 }}>{notice}</Alert> : null}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 1.5, sm: 3 }, py: 2 }}>
          {messageCursor ? <Button onClick={() => activeConversationId && void loadMessages(activeConversationId, true, messageCursor)} size="small" sx={{ display: "block", mx: "auto", mb: 2 }}>Load earlier messages</Button> : null}
          {loadingMessages && messages.length === 0 ? <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center", py: 6 }}><CircularProgress size={22} /><Typography color="text.secondary">Loading conversation...</Typography></Stack> : null}
          {!loadingMessages && activeConversation && messages.length === 0 ? (
            <Stack spacing={1} sx={{ alignItems: "center", justifyContent: "center", minHeight: "100%", textAlign: "center" }}>
              <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 42 }} />
              <Typography sx={{ fontWeight: 800 }} variant="h3">What would you like to explore?</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 520 }} variant="body2">Ask about completed trades, results, timing, tickers, or patterns in the trading record saved to this Journal account.</Typography>
            </Stack>
          ) : null}
          {!activeConversation && !loadingConversations ? (
            <Stack spacing={2} sx={{ alignItems: "center", justifyContent: "center", minHeight: "100%", textAlign: "center" }}>
              <ChatBubbleOutlineRoundedIcon color="primary" sx={{ fontSize: 46 }} />
              <Typography sx={{ fontWeight: 800 }} variant="h3">Start a conversation about your trading</Typography>
              <Button onClick={() => void createConversation()} startIcon={<AddRoundedIcon />} variant="contained">New conversation</Button>
            </Stack>
          ) : null}
          <Stack spacing={1.5}>
            {messages.map((message) => {
              const user = message.role === "user";
              const text = user ? message.originalUserTextPrivate : message.assistantTextPrivate;
              if (!text && message.generationState !== "pending" && message.generationState !== "failed") return null;
              return (
                <Box key={message.messageId} sx={{ alignSelf: user ? "flex-end" : "flex-start", bgcolor: user ? "primary.main" : "#EEF4FF", borderRadius: 2, color: user ? "primary.contrastText" : "text.primary", maxWidth: { xs: "92%", sm: "78%" }, px: 2, py: 1.5 }}>
                  {message.generationState === "pending" ? <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><CircularProgress size={16} /><Typography variant="body2">Thinking...</Typography></Stack>
                    : message.generationState === "failed" ? <Typography variant="body2">I couldn’t complete that answer. You can try asking again.</Typography>
                      : <Typography sx={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }} variant="body2">{text}</Typography>}
                </Box>
              );
            })}
            {sending ? <Box sx={{ alignSelf: "flex-start", bgcolor: "#EEF4FF", borderRadius: 2, px: 2, py: 1.5 }}><Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><CircularProgress size={16} /><Typography variant="body2">Thinking...</Typography></Stack></Box> : null}
            <div ref={endRef} />
          </Stack>
        </Box>

        <Box sx={{ borderTop: 1, borderColor: "divider", p: { xs: 1.25, sm: 2 } }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
            <TextField
              disabled={!activeConversation || activeConversation.state !== "active" || sending}
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
              placeholder={activeConversation
                ? dailyContext ? "Ask about this trading day..." : "Ask about your trading..."
                : "Start a conversation to ask a question"}
              value={question}
            />
            <IconButton aria-label="Send question" color="primary" disabled={!question.trim() || !activeConversation || sending} onClick={() => void sendQuestion()} sx={{ height: 48, width: 48 }}><SendRoundedIcon /></IconButton>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="caption">Press Enter to send. Use Shift + Enter for a new line.</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
