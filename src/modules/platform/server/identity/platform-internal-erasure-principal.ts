/** Human-directory/empty-owner-foundation compatibility only. This predicate
 * grants no authority and never changes the retained principal or its FKs.
 * The caller aliases platform_users as `user`. Unknown/mutated rows stay visible
 * and continue to make the owner foundation nonempty. */
export const INTERNAL_RETAINED_ERASURE_PRINCIPAL_SQL = `(
  user.user_id = '00000000-0000-4000-8000-000000000195'
  AND user.auth_provider = 'erasure'
  AND user.auth_subject = 'paid-partner-retained-principal-v1'
  AND user.display_name = 'Removed Partner owner'
  AND user.status = 'disabled'
  AND user.created_at_utc = '2026-11-02T00:00:00.000Z'
  AND user.updated_at_utc = '2026-11-02T00:00:00.000Z'
  AND NOT EXISTS (SELECT 1 FROM platform_auth_identities internal_identity WHERE internal_identity.user_id = user.user_id OR internal_identity.linked_by_user_id = user.user_id)
  AND NOT EXISTS (SELECT 1 FROM platform_auth_sessions internal_session WHERE internal_session.user_id = user.user_id)
  AND NOT EXISTS (SELECT 1 FROM platform_workspace_memberships internal_membership
    WHERE internal_membership.user_id = user.user_id OR internal_membership.created_by_user_id = user.user_id)
  AND NOT EXISTS (SELECT 1 FROM platform_user_preferences internal_preferences WHERE internal_preferences.user_id = user.user_id)
)`;
