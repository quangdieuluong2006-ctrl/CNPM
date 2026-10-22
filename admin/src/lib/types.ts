export type ClientType = "web" | "mobile" | "admin";

export interface PresenceUser {
  userId: number;
  fullName: string;
  email: string;
  role: "user" | "admin";
  clientTypes: ClientType[];
  openSessions: number;
  onlineSince: string;
  lastSeenAt: string;
}

export interface PresenceResponse {
  count: number;
  activeUsers: number;
  activeUsersAll: number;
  users: PresenceUser[];
  ts: string;
}

export interface StatsResponse {
  totalUsers: number;
  activeUsers: number;
  dailyActiveUsers: number;
  jobsToday: number;
  jobsProcessing: number;
  jobsFailedToday: number;
  jobsByDay: { day: string; jobs: number }[];
  targetLanguages: { code: string; name: string; count: number }[];
}

export interface PresenceUpdate {
  activeUsers: number;
  activeUsersAll: number;
  changed: { userId: number; type: "online" | "offline" } | null;
  ts: string;
}
