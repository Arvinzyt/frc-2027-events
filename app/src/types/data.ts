export interface EpaStats {
  registered: number
  with_epa: number
  max: number
  top8_avg: number
  top24_avg: number
  mean: number
  median: number
}

export interface TeamEntry {
  team: number
  name: string
  epa: number | null
}

export type EventStatus =
  | 'unchanged'
  | 'week_changed'
  | 'unchanged_venue_moved'
  | 'new_2027'

export type DataStatus = 'registered' | 'no_epa' | 'no_data'

export interface FrcEvent {
  code: string
  name: string
  week: number | null
  location: string
  date_start: string
  date_range: string
  capacity: number | null
  registered: number | null
  status: EventStatus
  data_status: DataStatus
  week_2026: number | null
  location_2026: string | null
  epa: EpaStats | null
  epa_source: string | null
  teams: TeamEntry[]
}

export interface WeekChange {
  code: string
  name: string
  location: string
  week_2026: number
  week_2027: number
  change: number
}

export interface DiscontinuedEvent {
  code: string
  name: string
  location: string
  week_2026: number | null
}

export interface DataMeta {
  generated_at: string
  event_count_2027: number
  event_count_2026: number
  new_event_count: number
  week_changed_count: number
  discontinued_count: number
  total_registered: number
  sources: string[]
  epa_note: string
}

export interface DataFile {
  meta: DataMeta
  events: FrcEvent[]
  week_changes: WeekChange[]
  discontinued: DiscontinuedEvent[]
}
