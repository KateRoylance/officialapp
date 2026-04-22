export type AdminStackParamList = {
  AdminTabs: undefined;
  PendingApprovals: { clientId?: string; clientName?: string } | undefined;
  ScheduledPosts: undefined;
  UnreadMessages: undefined;
  ClientMessages: { clientId: string; clientName: string };
  AddClient: undefined;
  ClientDetail: { clientId: string; clientName: string };
  NotificationSettings: undefined;
};

export type AdminTabParamList = {
  DashboardTab: undefined;
  ClientsTab: undefined;
  IdeasTab: undefined;
  UploadsTab: undefined;
  ContentTab: undefined;
  SettingsTab: undefined;
};
