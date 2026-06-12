// 2026-04-17 09:45 PM America/Toronto
// Cluster nearby levels so one representative carries the strongest score while weaker duplicates are discounted.
import { LEVEL_SCORE_CONFIG } from "./level-score-config.js";
import { clamp, overlapRatio, priceDistancePct, zonesOverlap } from "./level-zone-utils.js";
function timeframePriority(timeframes) {
    const rank = {
        daily: 5,
        "4h": 4,
        "1h": 3,
        "15m": 2,
        "5m": 1,
    };
    return timeframes.reduce((best, timeframe) => Math.max(best, rank[timeframe]), 0);
}
export function chooseClusterRepresentative(clusterLevels) {
    return [...clusterLevels].sort((left, right) => right.structuralStrengthScore - left.structuralStrengthScore ||
        timeframePriority(right.sourceTimeframes) - timeframePriority(left.sourceTimeframes) ||
        left.cleanlinessStdDevPct - right.cleanlinessStdDevPct ||
        right.strongestReactionMovePct - left.strongestReactionMovePct ||
        left.barsSinceLastReaction - right.barsSinceLastReaction)[0];
}
export function clusterLevels(levels, config = LEVEL_SCORE_CONFIG) {
    if (levels.length === 0) {
        return [];
    }
    const sorted = [...levels].sort((left, right) => left.price - right.price);
    const clusters = [];
    let currentMembers = [sorted[0]];
    let clusterLow = sorted[0].zoneLow ?? sorted[0].price;
    let clusterHigh = sorted[0].zoneHigh ?? sorted[0].price;
    function flushCluster(index) {
        const representative = currentMembers.reduce((best, member) => member.price > best.price ? member : best);
        clusters.push({
            id: `${representative.type}-cluster-${index}`,
            type: representative.type,
            zoneLow: clusterLow,
            zoneHigh: clusterHigh,
            memberIds: currentMembers.map((level) => level.id),
            representativeId: representative.id,
        });
    }
    for (let index = 1; index < sorted.length; index += 1) {
        const candidate = sorted[index];
        const candidateLow = candidate.zoneLow ?? candidate.price;
        const candidateHigh = candidate.zoneHigh ?? candidate.price;
        const clusterZone = { zoneLow: clusterLow, zoneHigh: clusterHigh };
        const candidateZone = { zoneLow: candidateLow, zoneHigh: candidateHigh };
        const representativeDistancePct = priceDistancePct((clusterLow + clusterHigh) / 2, (candidateLow + candidateHigh) / 2);
        const enoughOverlap = overlapRatio(clusterZone, candidateZone) >= config.clustering.zoneOverlapThreshold;
        const practicallyNearby = representativeDistancePct <= config.clustering.maxRepresentativeDistancePct ||
            zonesOverlap(clusterZone, candidateZone);
        if (enoughOverlap || practicallyNearby) {
            currentMembers.push(candidate);
            clusterLow = Math.min(clusterLow, candidateLow);
            clusterHigh = Math.max(clusterHigh, candidateHigh);
            continue;
        }
        flushCluster(clusters.length + 1);
        currentMembers = [candidate];
        clusterLow = candidateLow;
        clusterHigh = candidateHigh;
    }
    flushCluster(clusters.length + 1);
    return clusters;
}
export function applyClusterPenalties(levels, clusters, config = LEVEL_SCORE_CONFIG) {
    const levelMap = new Map(levels.map((level) => [level.id, level]));
    return levels.map((level) => {
        const cluster = clusters.find((candidateCluster) => candidateCluster.memberIds.includes(level.id));
        if (!cluster) {
            return {
                ...level,
                clusterPenalty: 0,
                clusterId: null,
                isClusterRepresentative: true,
            };
        }
        const members = cluster.memberIds
            .map((memberId) => levelMap.get(memberId))
            .filter((member) => member !== undefined);
        const representative = chooseClusterRepresentative(members);
        const isRepresentative = representative.id === level.id;
        if (isRepresentative || members.length === 1) {
            return {
                ...level,
                clusterPenalty: 0,
                clusterId: cluster.id,
                isClusterRepresentative: true,
            };
        }
        const representativeZone = { zoneLow: representative.zoneLow, zoneHigh: representative.zoneHigh };
        const levelZone = { zoneLow: level.zoneLow, zoneHigh: level.zoneHigh };
        const memberOverlap = overlapRatio(levelZone, representativeZone);
        const structuralGap = Math.max(representative.structuralStrengthScore - level.structuralStrengthScore, 0);
        const basePenalty = 2.5 + memberOverlap * 3.5 + clamp(structuralGap / 20, 0, 2);
        const clusterPenalty = -clamp(basePenalty, 0, config.penalties.clusterMax);
        return {
            ...level,
            clusterPenalty,
            clusterId: cluster.id,
            isClusterRepresentative: false,
        };
    });
}
