// 2026-04-14 09:28 PM America/Toronto
// Utility helpers for zone interaction logic.
export function distancePctFromZone(price, zone) {
    if (price >= zone.zoneLow && price <= zone.zoneHigh) {
        return 0;
    }
    const boundary = price < zone.zoneLow ? zone.zoneLow : zone.zoneHigh;
    return Math.abs(price - boundary) / Math.max(boundary, 0.0001);
}
export function isInsideZone(price, zone) {
    return price >= zone.zoneLow && price <= zone.zoneHigh;
}
export function isAboveZone(price, zone) {
    return price > zone.zoneHigh;
}
export function isBelowZone(price, zone) {
    return price < zone.zoneLow;
}
export function zoneMidPrice(zone) {
    return (zone.zoneLow + zone.zoneHigh) / 2;
}
