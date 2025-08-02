export interface ScheduleData {
  week: number;
  teamId: number;
  subjectId: number;
  date: string;
  dayOfWeek: string;
  session: 'morning' | 'afternoon' | 'evening';
  lecturerId: number | null;
  locationId: number | null;
}

export interface DateRange {
  start: ScheduleData;
  end: ScheduleData;
}

export interface ExcelConfig {
  templatePath: string;
  outputPath: string;
  dataPath: string;
  worksheetIndex: number;
  dayColumn: string;
  timeSlotColumn: string;
  firstTimeSlotRow: number;
  rowPerTimeSlot: number;
  timeSlots: string[];
}

export interface CellPosition {
  row: number;
  column: string;
  value: string;
}

export interface MergedCellRange {
  startRow: number;
  endRow: number;
  column: string;
  value: string;
}

export interface SubjectMapping {
  [key: number]: string;
}

export interface LecturerMapping {
  [key: number]: string;
}

export interface LocationMapping {
  [key: number]: string;
} 