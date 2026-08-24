export type JournalAdminPermission =
  | "read_operations"
  | "read_user_details"
  | "read_import_details"
  | "manage_users"
  | "manage_statement_formats"
  | "export_developer_packages"
  | "download_consented_sources";

export type JournalAdminScope = Readonly<{
  userId: string;
  role: "journal_owner_admin" | "development_journal_owner_admin";
  mode: "production_discord_owner" | "local_development_owner";
  authorizedAtUtc: string;
  discordOwnerVerifiedAtUtc: string | null;
  permissions: readonly JournalAdminPermission[];
}>;

export const JOURNAL_ADMIN_PERMISSIONS: readonly JournalAdminPermission[] =
  Object.freeze([
    "read_operations",
    "read_user_details",
    "read_import_details",
    "manage_users",
    "manage_statement_formats",
    "export_developer_packages",
    "download_consented_sources",
  ]);
