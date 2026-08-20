"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { AiReviewAuthoredDocument } from "@/app/(dashboard)/ai-reviews/ai-review-authored-document";
import { AiReviewDocument } from "@/app/(dashboard)/ai-reviews/ai-review-document";
import { AiReviewsIssuedList } from "@/app/(dashboard)/ai-reviews/ai-reviews-issued-list";
import { DashboardPage, DashboardUnavailableState } from "@/app/dashboard-ui";
import {
  COACH_AI_REVIEW_OFFLINE_LIST_VIEW_KEY,
  COACH_AI_REVIEW_OFFLINE_VIEW_VERSION,
  coachAiReviewOfflineDetailViewKey,
  isCoachAiReviewOfflineDetailViewModel,
  isCoachAiReviewOfflineListViewModel,
  type CoachAiReviewOfflineDetailViewModel,
  type CoachAiReviewOfflineListViewModel,
} from "@/src/modules/coach/contracts/coach-ai-review-offline-view-contracts";
import { readPlatformOfflineView } from "@/src/modules/platform/client/pwa/offline-projection-store";
import { PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

import { OfflineSavedViewStatus } from "./offline-saved-view-status";

type State =
  | Readonly<{ status: "loading" | "unavailable" }>
  | Readonly<{ model: CoachAiReviewOfflineListViewModel | CoachAiReviewOfflineDetailViewModel; savedAtUtc: string; status: "ready" }>;

export function OfflineAiReviewsSurface({ partitionKey, pathname }: { partitionKey: string; pathname: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const list = pathname === "/ai-reviews";
  useEffect(() => {
    let active = true;
    const viewKey = list ? COACH_AI_REVIEW_OFFLINE_LIST_VIEW_KEY : coachAiReviewOfflineDetailViewKey(pathname);
    void readPlatformOfflineView(partitionKey, viewKey).then((view) => {
      if (!active) return;
      const validModel = list
        ? isCoachAiReviewOfflineListViewModel(view?.model)
        : isCoachAiReviewOfflineDetailViewModel(view?.model);
      if (view?.schemaVersion !== PLATFORM_OFFLINE_SAVED_VIEW_SCHEMA_VERSION || view.pathname !== pathname || view.routeViewVersion !== COACH_AI_REVIEW_OFFLINE_VIEW_VERSION || !validModel) {
        setState({ status: "unavailable" });
        return;
      }
      setState({ model: view.model as CoachAiReviewOfflineListViewModel | CoachAiReviewOfflineDetailViewModel, savedAtUtc: view.savedAtUtc, status: "ready" });
    }).catch(() => { if (active) setState({ status: "unavailable" }); });
    return () => { active = false; };
  }, [list, partitionKey, pathname]);

  if (state.status !== "ready") {
    return (
      <DashboardPage>
        <Typography component="h1" variant="h1">AI Reviews</Typography>
        {state.status === "loading" ? <Stack role="status" sx={{ alignItems: "center", justifyContent: "center", minHeight: 300 }}><CircularProgress size={28} /></Stack> : <DashboardUnavailableState compact description={list ? "Open AI Reviews once while connected to save the issued-review list on this device." : "Open this issued review once while connected to make its current document available offline."} title={list ? "No saved AI Reviews list is available" : "This AI Review is not saved on this device"} />}
      </DashboardPage>
    );
  }
  if (state.model.kind === "ai-review-list") {
    return (
      <DashboardPage>
        <Box>
          <Typography component="h1" variant="h1">AI Reviews</Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }} variant="body2">Read issued weekly, two-week and monthly reviews saved for this Trade Tracker account.</Typography>
        </Box>
        <OfflineSavedViewStatus savedAtUtc={state.savedAtUtc} message="Issued reviews saved on this device are available offline. Reconnect to check availability or request a new review." />
        <AiReviewsIssuedList monthly={state.model.monthly} periodic={state.model.periodic} />
      </DashboardPage>
    );
  }
  return (
    <DashboardPage>
      <Box sx={{ mb: -0.75 }}><Button href="/ai-reviews" size="small" variant="text">Back to AI Reviews</Button></Box>
      <OfflineSavedViewStatus savedAtUtc={state.savedAtUtc} message="This issued review document is saved on this device. Reconnect to load newer reviews." />
      {state.model.documentKind === "authored"
        ? <AiReviewAuthoredDocument view={state.model.view} />
        : <AiReviewDocument view={state.model.view} />}
    </DashboardPage>
  );
}
