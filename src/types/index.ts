export type TaskType = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: number; // timestamp
  type: TaskType;
  dueDate?: string; // ISO date string YYYY-MM-DD
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  claimed: boolean;
  rewardPoints: number;
  condition: (state: AppState) => boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}

export interface UserStats {
  user_id: string;
  points: number;
  total_points: number;
  tasks_completed_daily: number;
  tasks_completed_weekly: number;
  tasks_completed_monthly: number;
}

export interface Lobby {
  id: string;
  code: string;
  name: string;
  owner_id: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  profile?: UserProfile; // Joined profile data
}

export interface AppState {
  points: number;
  totalPointsEarned: number;
  tasks: Task[];
  achievements: Achievement[];
  themes: Theme[];
  activeThemeId: string;
}

export interface AppContextType extends AppState {
  addTask: (text: string, type?: TaskType, dueDate?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  unlockTheme: (id: string) => void;
  setTheme: (id: string) => void;
  resetDailyTasks: () => void;
  addPoints: (amount: number) => void;
  claimAchievement: (id: string) => void;
}
