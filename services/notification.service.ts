import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {

  static async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        
        if (!projectId) {
          console.error('Project ID not found');
          return null;
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        
        console.log('Push token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  static async scheduleNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }


  static async cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }


  static async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

 
  static async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

 
  static async clearBadgeCount() {
    await Notifications.setBadgeCountAsync(0);
  }

 
  static async dismissNotification(notificationId: string) {
    await Notifications.dismissNotificationAsync(notificationId);
  }

 
  static async dismissAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  
  static async getPresentedNotifications() {
    return await Notifications.getPresentedNotificationsAsync();
  }
}

