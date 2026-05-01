import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";
import { NotificationPreferencesService } from "@/services/notificationPreferences.service";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

export interface NotificationData {
  screen?: string;
  id?: string;
  [key: string]: any;
}

export function useNotifications() {
  const userService = new UserService();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const token =
          await NotificationService.registerForPushNotificationsAsync();

        if (!token) {
          console.warn("Failed to get push notification token");
          return;
        }

        setExpoPushToken(token);
        console.log("Expo Push Token obtained:", token);

        const { user } = useUserStore.getState();

        if (!user || !user.id) {
          console.warn("User not found in store, will update token later");
          return;
        }

        await updateTokenWithRetry(token, user.id);

        await NotificationPreferencesService.initializeDailyReminder();
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    };

    const updateTokenWithRetry = async (
      token: string,
      userId: string,
      retries = 3,
    ) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          await userService.updateUserExpoPushToken(token, userId);
          return;
        } catch (error) {
          console.error(
            `❌ Failed to update token (attempt ${attempt}/${retries}):`,
            error,
          );

          if (attempt === retries) {
            console.error("Failed to update push token after all retries");
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    };

    initNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content
          .data as NotificationData;
        handleNotificationNavigation(data);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationNavigation = (data: NotificationData) => {
    if (data.screen) {
      switch (data.screen) {
        case "quiz":
          if (data.id) {
            router.push(`/quiz?id=${data.id}`);
          } else {
            router.push("/quiz");
          }
          break;
        case "leaderboard":
          router.push("/leaderboard");
          break;
        case "profile":
          router.push("/(tabs)/profile");
          break;
        case "nft":
          if (data.id) {
            router.push(`/nft/${data.id}`);
          }
          break;
        case "roadmap":
          if (data.id) {
            router.push(`/roadmaps/${data.id}`);
          }
          break;
        default:
      }
    }
  };

  const updateExpoPushToken = async (userId: string) => {
    if (!expoPushToken) {
      console.warn("No expo push token available to update");
      return;
    }

    try {
      await userService.updateUserExpoPushToken(expoPushToken, userId);
    } catch (error) {
      console.error("❌ Failed to manually update expo push token:", error);
      throw error;
    }
  };

  return {
    expoPushToken,
    notification,
    updateExpoPushToken,
    scheduleNotification: NotificationService.scheduleNotification,
    cancelAllScheduledNotifications:
      NotificationService.cancelAllScheduledNotifications,
    setBadgeCount: NotificationService.setBadgeCount,
    clearBadgeCount: NotificationService.clearBadgeCount,
  };
}
