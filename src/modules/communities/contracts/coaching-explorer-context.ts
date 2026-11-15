/** Explicit context discriminator: independent reviews never fabricate a community slug. */
export type CoachingExplorerContext=
 | Readonly<{communitySlug:string;reviewId:string;relationshipId:string;kind?:'community'}>
 | Readonly<{kind:'independent';reviewId:string;enrollmentId:string}>;
