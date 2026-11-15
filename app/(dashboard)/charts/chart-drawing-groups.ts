import { drawingTools, isPatternTool, type Tool } from "./chart-drawings";

const groups={
  "Trend lines and channels": ["trendline","arrow","ray","infoLine","extendedLine","trendAngle","horizontal","horizontalRay",
    "vertical","crossline","parallel","flat","disjoint","regressionTrend"],
  "Fibonacci and Gann": ["fibRetracement","fibExtension","pitchfork","schiffPitchfork","modifiedSchiffPitchfork","insidePitchfork",
    "fibChannel","fibTimeZone","gannBox","gannSquareFixed","gannSquare","gannFan","fibSpeedResistanceFan","trendBasedFibTime",
    "fibCircles","pitchfan","fibSpiral","fibSpeedResistanceArcs","fibWedge"],
  "Patterns and cycles": [...(Object.keys(drawingTools) as Tool[]).filter(isPatternTool),"cyclicLines","timeCycles","sineLine"],
  "Shapes and brush": ["brush","highlighter","rectangle","rotatedRectangle","circle","ellipse","path","curve","polyline","triangle","arc","doubleCurve"],
  "Notes and symbols": ["text","note","anchoredNote","signpost","callout","comment","priceLabel","priceNote","arrowMarker","arrowLeft","arrowRight",
    "arrowUp","arrowDown","flagMark","pin","table","icon","sticker","emoji"],
  "Forecasts and measurements": ["longPosition","shortPosition","positionForecast","dateRange","priceRange","datePriceRange","barsPattern","ghostFeed",
    "projection","sector","anchoredVwap","fixedRangeProfile","anchoredVolumeProfile"],
} satisfies Record<string,readonly Tool[]>;
type DrawingGroup=keyof typeof groups;
export const drawingGroups=Object.entries(groups) as [DrawingGroup,readonly Tool[]][];
