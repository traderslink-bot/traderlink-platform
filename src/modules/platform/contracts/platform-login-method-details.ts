export type LoginMethodDetails = Readonly<{
  signedInWith: string;
  providers: readonly Readonly<{
    provider: string;
    connected: boolean;
    accountName: string | null;
    email: string | null;
  }>[];
  email: Readonly<{
    address: string | null;
    verified: boolean;
    connected: boolean;
    pendingAddress: string | null;
  }>;
}>;
