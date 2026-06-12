const FORBIDDEN_PATTERNS = [
    /\bbuy\b/i,
    /\bsell\b/i,
    /\bgood trade\b/i,
    /\bbad trade\b/i,
    /\bmistake\b/i,
    /\bcoaching\b/i,
    /\bentry\b/i,
    /\bexit\b/i,
    /\bstop loss\b/i,
    /\btarget\b/i,
    /\btake profit\b/i,
    /\badd\b/i,
    /\btrim\b/i,
    /\bsize\b/i,
];
function formatNumber(value) {
    return Number.isInteger(value) ? value.toString() : Number(value.toFixed(4)).toString();
}
function isAllowedLine(line) {
    return !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(line));
}
function pushAllowed(lines, line) {
    if (isAllowedLine(line)) {
        lines.push(line);
    }
}
function joinValues(values) {
    return values.filter(isAllowedLine).join(" | ");
}
function addValueGroup(lines, label, values) {
    const joined = joinValues(values);
    if (joined.length > 0) {
        lines.push(`${label}: ${joined}`);
    }
}
function formatExplanation(explanation) {
    const lines = [];
    pushAllowed(lines, `${explanation.kind} zone ${formatNumber(explanation.representativePrice)} (${explanation.levelId})`);
    pushAllowed(lines, `Explanation: ${explanation.explanation}`);
    addValueGroup(lines, "Facts", explanation.facts);
    addValueGroup(lines, "Confluences", explanation.confluences);
    addValueGroup(lines, "Warnings", explanation.warnings);
    addValueGroup(lines, "Session facts", explanation.nearbySessionFacts);
    addValueGroup(lines, "Volume facts", explanation.nearbyVolumeFacts);
    addValueGroup(lines, "Shelf facts", explanation.nearbyShelfFacts);
    addValueGroup(lines, "Context tags", explanation.contextTags);
    return lines;
}
function sectionSpecs(report) {
    return [
        { title: "Major Support", count: report.counts.majorSupport },
        { title: "Major Resistance", count: report.counts.majorResistance },
        { title: "Intermediate Support", count: report.counts.intermediateSupport },
        { title: "Intermediate Resistance", count: report.counts.intermediateResistance },
        { title: "Intraday Support", count: report.counts.intradaySupport },
        { title: "Intraday Resistance", count: report.counts.intradayResistance },
        { title: "Extension Support", count: report.counts.extensionSupport },
        { title: "Extension Resistance", count: report.counts.extensionResistance },
    ];
}
function formatCountSummary(report) {
    const counts = report.counts;
    return [
        `major support ${counts.majorSupport}`,
        `major resistance ${counts.majorResistance}`,
        `intermediate support ${counts.intermediateSupport}`,
        `intermediate resistance ${counts.intermediateResistance}`,
        `intraday support ${counts.intradaySupport}`,
        `intraday resistance ${counts.intradayResistance}`,
        `extension support ${counts.extensionSupport}`,
        `extension resistance ${counts.extensionResistance}`,
    ].join(", ");
}
function formatSafetySection(report) {
    return {
        title: "Safety",
        lines: [
            `Level output unchanged: ${report.safety.levelOutputUnchanged}`,
            `VWAP facts-only: ${report.safety.factsOnlyVWAP}`,
            `Volume shelves facts-only: ${report.safety.shelvesAreFactsOnly}`,
            `No runtime behavior change: ${report.safety.noRuntimeBehaviorChange}`,
        ],
    };
}
export function formatLevelContextReport(report) {
    const sections = [
        {
            title: "Summary",
            lines: [
                `Symbol: ${report.symbol}`,
                `Generated at: ${report.generatedAt}`,
                `Explained levels: ${report.counts.total}`,
                `Counts: ${formatCountSummary(report)}`,
            ],
        },
    ];
    let cursor = 0;
    for (const spec of sectionSpecs(report)) {
        const explanations = report.explanations.slice(cursor, cursor + spec.count);
        cursor += spec.count;
        if (explanations.length === 0) {
            continue;
        }
        sections.push({
            title: spec.title,
            lines: explanations.flatMap(formatExplanation),
        });
    }
    sections.push(formatSafetySection(report));
    return {
        symbol: report.symbol,
        generatedAt: report.generatedAt,
        summary: `${report.symbol} facts-only level context: ${report.counts.total} explained level(s).`,
        sections,
        safety: report.safety,
    };
}
