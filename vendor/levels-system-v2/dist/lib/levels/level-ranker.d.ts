import type { LevelEngineConfig } from "./level-config.js";
import type { FinalLevelZone, LevelEngineOutput } from "./level-types.js";
export declare function rankLevelZones(params: {
    symbol: string;
    supportZones: FinalLevelZone[];
    resistanceZones: FinalLevelZone[];
    specialLevels: LevelEngineOutput["specialLevels"];
    metadata: LevelEngineOutput["metadata"];
    config: LevelEngineConfig;
}): LevelEngineOutput;
//# sourceMappingURL=level-ranker.d.ts.map