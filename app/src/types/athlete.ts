/**
 * Athlete tracking and session notes types
 */

export interface Athlete {
  id: string;
  parent_id: string;
  name: string;
  date_of_birth: string | null;
  sports: string[];
  school: string | null;
  profile_image_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  parent?: { id: string; full_name: string | null };
}

export type EffortRating = 1 | 2 | 3 | 4 | 5;

export interface SessionNote {
  id: string;
  booking_id: string;
  athlete_id: string;
  coach_id: string;
  worked_on: string;
  progress_observations: string | null;
  focus_areas: string | null;
  effort_rating: EffortRating | null;
  needs_attention: boolean;
  attention_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  athlete?: Athlete;
  booking?: {
    id: string;
    start_time: string;
    session_type?: { name: string };
  };
}

export interface AthleteStats {
  totalSessions: number;
  completedSessions: number;
  currentStreak: number;
  longestStreak: number;
  averageEffort: number | null;
  lastSessionDate: string | null;
}

export interface AttendanceDay {
  date: string;
  attended: boolean;
  sessionCount: number;
}

export interface AthleteWithStats extends Athlete {
  stats?: AthleteStats;
  recentNotes?: SessionNote[];
}
