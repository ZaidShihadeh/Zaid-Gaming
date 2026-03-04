export type MediaStatus = "pending" | "approved" | "rejected";

export interface MediaItem {
  id: string;
  userId: string;
  title: string;
  url: string;
  createdAt: string; // ISO
  status: MediaStatus;
  creditName: string;
}

export interface CommentItem {
  id: string;
  mediaId: string;
  userId: string;
  message: string;
  createdAt: string; // ISO
}

export interface MediaListResponse {
  success: boolean;
  items: MediaItem[];
}

export interface PendingListResponse extends MediaListResponse {}

export interface ApproveRejectResponse {
  success: boolean;
  item?: MediaItem;
}

export interface CreateMediaRequest {
  title: string;
  url: string;
}

export interface CommentsResponse {
  success: boolean;
  comments: CommentItem[];
}

export interface CreateCommentRequest {
  message: string;
}
