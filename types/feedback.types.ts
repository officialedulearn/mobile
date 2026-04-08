import type { IsoDateString } from './common.types';

export type FeedbackCategory =
  | 'bug'
  | 'feature'
  | 'improvement'
  | 'other';

export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export type Feedback = {
  id: string;
  userId: string;
  content: string;
  category: FeedbackCategory | null;
  status: FeedbackStatus;
  createdAt: IsoDateString | Date;
  reviewedAt: IsoDateString | Date | null;
  reviewedBy: string | null;
};

export type CreateFeedbackRequest = {
  content: string;
  category?: FeedbackCategory;
  userId: string;
};

export type UpdateFeedbackStatusRequest = {
  status: FeedbackStatus;
};
