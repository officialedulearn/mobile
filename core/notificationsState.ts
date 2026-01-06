import { NotificationsService, Notification } from "@/services/notifications.service";
import { create } from "zustand";

interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
  pollingInterval: NodeJS.Timeout | null;
  
  fetchNotifications: (order?: 'asc' | 'desc') => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  refreshNotifications: () => Promise<void>;
  resetState: () => void;
}

const notificationsService = new NotificationsService();

const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  pollingInterval: null,
  
  fetchNotifications: async (order: 'asc' | 'desc' = 'desc') => {
    try {
      set({ isLoading: true, error: null });
      const notifications = await notificationsService.getNotifications(order);
      set({ 
        notifications, 
        isLoading: false,
        lastFetchedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      });
    }
  },
  
  deleteNotification: async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId);
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== notificationId)
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  },
  
  startPolling: (intervalMs: number = 30000) => {
    const { stopPolling, fetchNotifications } = get();
    
    stopPolling();
    
    const interval = setInterval(() => {
      fetchNotifications('desc');
    }, intervalMs);
    
    set({ pollingInterval: interval });
  },
  
  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null });
    }
  },
  
  refreshNotifications: async () => {
    await get().fetchNotifications('desc');
  },
  
  resetState: () => {
    const { stopPolling } = get();
    stopPolling();
    set({
      notifications: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,
      pollingInterval: null
    });
  }
}));

export default useNotificationsStore;





