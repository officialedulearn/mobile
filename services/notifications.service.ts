import httpClient from "@/utils/httpClient";

export interface Notification {
    id: string;
    title: string;
    content: string;
    userId: string;
    createdAt: Date;
}

export class NotificationsService {
    async getNotifications(order: 'asc' | 'desc' = 'desc'): Promise<Notification[]> {
        try {
            const response = await httpClient.get(`/notifications?order=${order}`);
            return response.data.notifications;
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    }

    async deleteNotification(notificationId: string): Promise<{ message: string }> {
        try {
            const response = await httpClient.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error("Error deleting notification:", error);
            throw error;
        }
    }
}



