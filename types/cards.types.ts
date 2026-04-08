export type ShareCardTheme = 'light' | 'dark';

export type OgCardQuery = {
  title: string;
  subtitle: string;
  mascot?: string;
  theme: ShareCardTheme;
};

export type UserCardQuery = {
  theme?: ShareCardTheme;
};
