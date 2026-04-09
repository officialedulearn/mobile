import { BaseService } from "./base.service";

export interface Notification {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
}

export class NotificationsService extends BaseService {
  async getNotifications(order: "asc" | "desc" = "desc"): Promise<Notification[]> {
    const response = await this.executeRequest<{ notifications: Notification[] }>(
      this.getClient().get(`/notifications?order=${order}`)
    );
    if (response.error) throw response.error;
    return response.data?.notifications ?? [];
  }

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const response = await this.executeRequest(
      this.getClient().delete(`/notifications/${notificationId}`)
    );
    if (response.error) throw response.error;
    return response.data!;
  }
}
