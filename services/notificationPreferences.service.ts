import * as Notifications from "expo-notifications";

const DAILY_NOTIFICATION_ID = "daily_quiz_reminder";

export class NotificationPreferencesService {
  static async scheduleDailyReminder(): Promise<void> {
    await this.cancelDailyReminder();

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_NOTIFICATION_ID,
        content: {
          title: "Daily Learning Time! 📚",
          body: "Complete your daily quiz to maintain your streak",
          data: { screen: "quiz" },
          sound: true,
        },
        trigger: {
          hour: 19,
          minute: 0,
          repeats: true,
        } as Notifications.CalendarTriggerInput,
      });
    } catch (error) {
      console.error("Error scheduling daily reminder:", error);
      throw error;
    }
  }

  static async cancelDailyReminder(): Promise<void> {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const dailyReminder = scheduledNotifications.find(
        (n) => n.identifier === DAILY_NOTIFICATION_ID,
      );

      if (dailyReminder) {
        await Notifications.cancelScheduledNotificationAsync(
          DAILY_NOTIFICATION_ID,
        );
      }
    } catch (error) {
      console.error("Error cancelling daily reminder:", error);
    }
  }

  static async initializeDailyReminder(): Promise<void> {
    await this.scheduleDailyReminder();
  }
}
