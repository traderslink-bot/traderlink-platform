export type CommunityPublicationFeedback = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
  href?: string;
}>;

export const EMPTY_PUBLICATION_FEEDBACK: CommunityPublicationFeedback = {
  status: "idle", message: "",
};
