export interface User {
  auth_id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_friend?: boolean;
  is_pending_friend?: boolean;
  is_pending_request?: boolean;
  mutual_friends?: number;
}

export interface UserCreate {
  username: string;
  email: string;
  auth_id: string;
}

export interface PlayerStats {
  user_id: string;
  team: "A" | "B";
  goals: number;
  assists: number;
  username?: string;
}

export interface Match {
  match_id: string;
  date: string;
  location: string;
  time: string;
  format: "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11";
  created_by: string;
  creator_username?: string;
  players: PlayerStats[];
  score: {
    teamA: number;
    teamB: number;
  };
  validations: {
    user_id: string;
    timestamp: string;
  }[];
  is_validated: boolean;
  created_at: string;
}

export interface UserStats {
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  by_format: {
    F5: number;
    F6: number;
    F7: number;
    F8: number;
    F9: number;
    F10: number;
    F11: number;
  };
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_matches: number;
  wins: number;
  goals: number;
  assists: number;
} 