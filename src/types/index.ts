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
}
