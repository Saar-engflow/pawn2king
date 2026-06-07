export type Rank = 'Pawn' | 'Knight' | 'Bishop' | 'Rook' | 'Queen' | 'King';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  rank: Rank;
  xp: number;
  level: number;
  streak_days: number;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Addiction {
  id: string;
  user_id: string;
  name: string;
  last_relapse_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  history?: RelapseRecord[];
}

export interface RelapseRecord {
  id: string;
  addiction_id: string;
  user_id: string;
  timestamp: string;
  reason: string | null;
  streak_before_relapse: string | null;
  created_at: string;
}

export interface Journal {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyRoutine {
  id: string;
  user_id: string;
  title: string;
  is_completed: boolean;
  category: 'morning' | 'deep-work' | 'evening' | 'general';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: 'active' | 'completed' | 'abandoned';
  category: 'business' | 'spiritual' | 'physical' | 'mental';
  progress: number;
  created_at: string;
  updated_at: string;
}
