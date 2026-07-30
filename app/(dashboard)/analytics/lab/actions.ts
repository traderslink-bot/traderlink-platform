"use server";

import { buildAnalyticsLabPreview } from "./lab-query";
import {
  persistAnalyticsLabSavedView,
  removeAnalyticsLabSavedView,
} from "./lab-saved-views";
import { normalizeAnalyticsLabQuery } from "./lab-query-validation";
import { resolveAnalyticsLabRuntime } from "./lab-runtime";
import type {
  AnalyticsLabDeleteSavedViewResult,
  AnalyticsLabQueryResult,
  AnalyticsLabSavedViewResult,
} from "./lab-types";

export async function runAnalyticsLabQuery(
  queryInput: unknown,
): Promise<AnalyticsLabQueryResult> {
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    const query = normalizeAnalyticsLabQuery(queryInput);
    return {
      ok: true,
      preview: buildAnalyticsLabPreview(query, runtime),
    };
  } catch {
    return {
      ok: false,
      message: "That combination could not be calculated from the current V3 data.",
    };
  }
}

export async function saveAnalyticsLabView(
  nameInput: unknown,
  queryInput: unknown,
): Promise<AnalyticsLabSavedViewResult> {
  const name =
    typeof nameInput === "string"
      ? nameInput.trim().replace(/\s+/g, " ")
      : "";
  if (name.length === 0 || name.length > 80) {
    return { ok: false, message: "Enter a view name up to 80 characters." };
  }
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    const query = normalizeAnalyticsLabQuery(queryInput);
    buildAnalyticsLabPreview(query, runtime);
    const view = await persistAnalyticsLabSavedView(runtime, name, query);
    return { ok: true, view };
  } catch {
    return { ok: false, message: "The view could not be saved." };
  }
}

export async function deleteAnalyticsLabView(
  id: unknown,
): Promise<AnalyticsLabDeleteSavedViewResult> {
  if (
    typeof id !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      id,
    )
  ) {
    return { ok: false, message: "The saved view could not be deleted." };
  }
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    const deleted = await removeAnalyticsLabSavedView(runtime, id);
    return deleted
      ? { ok: true, id }
      : { ok: false, message: "The saved view no longer exists." };
  } catch {
    return { ok: false, message: "The saved view could not be deleted." };
  }
}


