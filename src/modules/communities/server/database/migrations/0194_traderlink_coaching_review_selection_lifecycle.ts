import type {PlatformMigration} from '@/src/modules/platform/server/database/platform-migration-contract';
import {independentCoachingSelectionLifecycleStatements} from '../../independent-coaching-selection-lifecycle-storage';
/** Coordinator-reserved identity. Registry/admission/application remain separate operations. */
export const traderLinkCoachingReviewSelectionLifecycleMigration:PlatformMigration=Object.freeze({
 moduleNamespace:'community',migrationId:'0194_traderlink_coaching_review_selection_lifecycle',executionOrder:254,
 statements:independentCoachingSelectionLifecycleStatements,
});
