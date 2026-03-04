export type NotificationType = "report" | "contact" | "announcement";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
}
