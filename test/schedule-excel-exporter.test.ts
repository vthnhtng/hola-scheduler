import { ScheduleExcelExporter } from '../lib/ScheduleExcelExporter';
import { ScheduleData } from '../types/ExcelExportTypes';

// Sample data matching the format from the user's example
const sampleData: ScheduleData[] = [
  // Day 1 - 19/5/2025
  { week: 1, teamId: 1, subjectId: 1, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 2, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 3, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 4, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 5, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 6, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 7, date: "2025-05-19", dayOfWeek: "Mon", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 8, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 9, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 10, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 11, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 12, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 13, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 14, date: "2025-05-19", dayOfWeek: "Mon", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 15, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 16, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 17, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 18, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 19, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 20, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 21, date: "2025-05-19", dayOfWeek: "Mon", session: "evening", lecturerId: null, locationId: null },

  // Day 2 - 20/5/2025
  { week: 1, teamId: 1, subjectId: 22, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 23, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 24, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 25, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 26, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 27, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 28, date: "2025-05-20", dayOfWeek: "Tue", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 29, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 30, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 31, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 32, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 33, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 34, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 35, date: "2025-05-20", dayOfWeek: "Tue", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 36, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 37, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 38, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 39, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 40, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 41, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 42, date: "2025-05-20", dayOfWeek: "Tue", session: "evening", lecturerId: null, locationId: null },

  // Day 3 - 21/5/2025
  { week: 1, teamId: 1, subjectId: 43, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 44, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 45, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 46, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 47, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 48, date: "2025-05-21", dayOfWeek: "Wed", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 49, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 50, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 51, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 52, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 53, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 54, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 55, date: "2025-05-21", dayOfWeek: "Wed", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 56, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 57, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 58, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 59, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 60, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 61, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 62, date: "2025-05-21", dayOfWeek: "Wed", session: "evening", lecturerId: null, locationId: null },

  // Day 4 - 22/5/2025
  { week: 1, teamId: 1, subjectId: 63, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 64, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 65, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 66, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 67, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 68, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 69, date: "2025-05-22", dayOfWeek: "Thu", session: "morning", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 70, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 71, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 72, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 73, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 74, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 75, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 76, date: "2025-05-22", dayOfWeek: "Thu", session: "afternoon", lecturerId: null, locationId: null },
  
  { week: 1, teamId: 1, subjectId: 77, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 2, subjectId: 78, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 3, subjectId: 79, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 4, subjectId: 80, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 5, subjectId: 81, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 6, subjectId: 82, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
  { week: 1, teamId: 7, subjectId: 83, date: "2025-05-22", dayOfWeek: "Thu", session: "evening", lecturerId: null, locationId: null },
];

async function testScheduleExcelExporter() {
  try {
    console.log('Starting Schedule Excel Exporter test...');
    
    // Create exporter instance
    const exporter = new ScheduleExcelExporter({
      outputPath: 'test-output/schedule-export.xlsx',
      teams: ['C1 (Nghĩa)', 'C2 (Nghĩa)', 'C3 (Đức)', 'C4 (TG.Tùng)', 'C5 (Việt Anh)', 'C6 (Đức)', 'C7 (TG.Lâm)']
    });
    
    // Export with sample data
    await exporter.export(sampleData);
    
    console.log('✅ Excel export completed successfully!');
    console.log('📁 File saved to: test-output/schedule-export.xlsx');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

// Run the test
testScheduleExcelExporter(); 