export type TaskType = 'duration' | 'completion'

export interface Domain {
  id: string
  name: string
  color: string
  icon: string | null
}

export interface TaskTemplate {
  id: string
  name: string
  domain_id: string
  type: TaskType
  points_per_unit: number
  unit_minutes: number | null
  default_duration_minutes: number | null
  color: string | null
  domain?: Domain
}

export interface TaskLog {
  id: string
  task_template_id: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS
  end_time: string | null // HH:MM:SS
  duration_minutes: number | null
  points_earned: number
  description: string | null
  created_at: string
  task_template?: TaskTemplate
}

export interface DomainPoints {
  domain_id: string
  domain_name: string
  domain_color: string
  total_points: number
  total_minutes: number
}

export interface HeatmapDayData {
  total: number
  domains: DomainPoints[]
}

export type Database = {
  public: {
    Tables: {
      domains: {
        Row: Domain
        Insert: Omit<Domain, 'id'> & { id?: string }
        Update: Partial<Domain>
      }
      task_templates: {
        Row: TaskTemplate
        Insert: Omit<TaskTemplate, 'id' | 'domain'> & { id?: string }
        Update: Partial<TaskTemplate>
      }
      task_logs: {
        Row: TaskLog
        Insert: Omit<TaskLog, 'id' | 'created_at' | 'task_template'> & { id?: string }
        Update: Partial<TaskLog>
      }
    }
  }
}
