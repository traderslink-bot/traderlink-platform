// 2026-04-16 02:03 PM America/Toronto
// Deterministic alert posting keys and family semantics.
export function alertPostingFamilyForEvent(event) {
    switch (event.eventType) {
        case "breakout":
        case "reclaim":
        case "fake_breakdown":
            return "bullish_resolution";
        case "breakdown":
            return "bearish_resolution";
        case "rejection":
        case "fake_breakout":
            return "failure";
        case "compression":
        case "level_touch":
        default:
            return "zone_context";
    }
}
export function alertPostingFamilyPriority(family) {
    switch (family) {
        case "zone_context":
            return 1;
        case "bullish_resolution":
        case "bearish_resolution":
            return 3;
        case "failure":
            return 4;
        default:
            return 1;
    }
}
export function buildAlertScopeKey(alert) {
    const context = alert.event.eventContext;
    return [
        alert.symbol,
        context.canonicalZoneId,
        alert.event.zoneKind,
        context.ladderPosition,
        context.zoneOrigin,
    ].join("|");
}
export function buildAlertStateKey(alert, family) {
    const context = alert.event.eventContext;
    return [
        buildAlertScopeKey(alert),
        family,
        context.zoneFreshness,
        context.zoneStrengthLabel,
        context.remapStatus,
        context.recentlyRefreshed ? "refreshed" : "steady",
        context.recentlyPromotedExtension ? "promoted" : "stable",
        context.dataQualityDegraded ? "degraded" : "clean",
    ].join("|");
}
export function isMateriallyNewAlertState(current, previous) {
    const currentContext = current.event.eventContext;
    const previousContext = previous.event.eventContext;
    return (currentContext.canonicalZoneId !== previousContext.canonicalZoneId ||
        currentContext.zoneOrigin !== previousContext.zoneOrigin ||
        currentContext.ladderPosition !== previousContext.ladderPosition ||
        currentContext.zoneFreshness !== previousContext.zoneFreshness ||
        currentContext.remapStatus !== previousContext.remapStatus ||
        currentContext.recentlyRefreshed !== previousContext.recentlyRefreshed ||
        currentContext.recentlyPromotedExtension !== previousContext.recentlyPromotedExtension ||
        currentContext.dataQualityDegraded !== previousContext.dataQualityDegraded);
}
