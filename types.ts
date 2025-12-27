export interface ScheduleEvent {
  id: string; // Using string UUID for easier JS handling
  title: string;
  date: string; // Format "yyyy-MM-dd"
  startMinute: number; // 0 - 1439
  endMinute: number; // 0 - 1439
  colorHex: string; // Hex code e.g., "#FF5733"
  groupId?: string; // ID to link recurring events together
}

export interface DayStats {
  totalEvents: number;
  busyMinutes: number;
  earliestStart: number | null;
  latestEnd: number | null;
}

export const COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];