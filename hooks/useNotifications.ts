import useUserStore from "@/core/userState";
import { UserService } from "@/services/auth.service";
import { NotificationService } from "@/services/notification.service";
import { NotificationPreferencesService } from "@/services/notificationPreferences.service";
import { extractPublicQuizIdFromUrl } from "@/utils/quizLinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

export interface NotificationData {
  screen?: string;
  id?: string;
  quizId?: string;
  url?: string;
  [key: string]: any;
}

const userService = new UserService();
const PUSH_TOKEN_SYNC_KEY_PREFIX = "expoPushTokenSynced";

const getPushTokenSyncKey = (userId: string) =>
  `${PUSH_TOKEN_SYNC_KEY_PREFIX}:${userId}`;

const initializeDailyReminderSafely = async () => {
  try {
    await NotificationPreferencesService.initializeDailyReminder();
  } catch (error) {
    //console.error("Failed to initialize daily notification reminder:", error);
  }
};

export function useNotifications() {
  const userId = useUserStore((s) => s.user?.id);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
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

    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data as
        | NotificationData
        | undefined;
      if (data) handleNotificationNavigation(data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const updateTokenWithRetry = async (
      token: string,
      retries = 3,
    ): Promise<boolean> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          await userService.updateUserExpoPushToken(token, userId);
          return true;
        } catch (error) {
          //console.error(
          //  `Failed to update Expo push token (attempt ${attempt}/${retries}):`,
          //  error,
          //);

          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      //console.error("Failed to update Expo push token after all retries");
      return false;
    };

    const syncExpoPushToken = async () => {
      const syncKey = getPushTokenSyncKey(userId);

      try {
        const syncedToken = await AsyncStorage.getItem(syncKey);
        if (syncedToken) {
          if (!cancelled) setExpoPushToken(syncedToken);
          await initializeDailyReminderSafely();
          return;
        }

        const token =
          await NotificationService.registerForPushNotificationsAsync();

        if (!token) {
          console.warn("Failed to get Expo push notification token");
          return;
        }

        if (!cancelled) setExpoPushToken(token);

        const updated = await updateTokenWithRetry(token);
        if (!updated) {
          await AsyncStorage.removeItem(syncKey);
          return;
        }

        await AsyncStorage.setItem(syncKey, token);
        await initializeDailyReminderSafely();
      } catch (error) {
        //console.error("Error syncing Expo push token:", error);
      }
    };

    void syncExpoPushToken();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleNotificationNavigation = (data: NotificationData) => {
    const quizIdFromUrl = data.url
      ? extractPublicQuizIdFromUrl(data.url)
      : null;
    if (quizIdFromUrl) {
      router.push({
        pathname: "/(tabs)/quizzes/[id]",
        params: { id: quizIdFromUrl },
      } as any);
      return;
    }

    if (data.screen) {
      switch (data.screen) {
        case "publicQuiz":
        case "quizPublic":
          if (data.quizId || data.id) {
            router.push({
              pathname: "/(tabs)/quizzes/[id]",
              params: { id: data.quizId ?? data.id },
            } as any);
          }
          break;
        case "quiz":
          if (data.quizId || data.id) {
            router.push({
              pathname: "/(tabs)/quizzes/[id]",
              params: { id: data.quizId ?? data.id },
            } as any);
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
      console.warn("No Expo push token available to update");
      return;
    }

    try {
      await userService.updateUserExpoPushToken(expoPushToken, userId);
      await AsyncStorage.setItem(getPushTokenSyncKey(userId), expoPushToken);
    } catch (error) {
      await AsyncStorage.removeItem(getPushTokenSyncKey(userId));
      //console.error("Failed to manually update Expo push token:", error);
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
