import type { IsoDateString } from './common.types';

export type InAppNotification = {
  id: string;
  content: string;
  title: string;
  userId: string;
  createdAt: IsoDateString | Date;
};

export type NotificationsListResponse = {
  notifications: InAppNotification[];
};

export type DeleteNotificationResponse = {
  message: string;
};
