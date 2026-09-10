export function acceptsRecapDateResponse(request: number, latestRequest: number, requestedDate: string, activeDate: string): boolean {
  return request === latestRequest && requestedDate === activeDate;
}

export function clearSavedRecapEdit(edits: Record<string, string>, candidateId: string, submittedText: string): Record<string, string> {
  if (edits[candidateId] !== submittedText) return edits;
  const next = { ...edits };
  delete next[candidateId];
  return next;
}
