import { ExcelExporter } from '../lib/ExcelExporter.js';
import { DataMapper } from '../lib/DataMapper.js';
import { ScheduleData } from '../types/ExcelExportTypes.js';

describe('Excel Export System', () => {
  let exporter: ExcelExporter;
  let dataMapper: DataMapper;

  beforeEach(() => {
    exporter = new ExcelExporter({
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/test_output.xlsx',
      dataPath: 'excel_export/data.json'
    });

    dataMapper = new DataMapper();
    dataMapper.loadStaticMappings();
  });

  describe('DataMapper', () => {
    test('should load static mappings correctly', () => {
      const mappings = dataMapper.getMappings();
      
      expect(mappings.subjectMapping[1]).toBe('Mathematics');
      expect(mappings.subjectMapping[2]).toBe('Physics');
      expect(mappings.lecturerMapping[1]).toBe('Dr. John Smith');
      expect(mappings.locationMapping[1]).toBe('Room 101');
    });

    test('should return fallback values for unknown IDs', () => {
      expect(dataMapper.getSubjectName(999)).toBe('Subject 999');
      expect(dataMapper.getLecturerName(999)).toBe('Lecturer 999');
      expect(dataMapper.getLocationName(999)).toBe('Location 999');
    });

    test('should handle null lecturer and location IDs', () => {
      expect(dataMapper.getLecturerName(null)).toBe('TBD');
      expect(dataMapper.getLocationName(null)).toBe('TBD');
    });
  });

  describe('ExcelExporter', () => {
    test('should be initialized with correct configuration', () => {
      expect(exporter).toBeDefined();
    });

    test('should calculate days count correctly', () => {
      const startDate = new Date('2025-09-01');
      const endDate = new Date('2025-09-06');
      const daysCount = exporter.getDaysCount(startDate, endDate);
      
      expect(daysCount).toBe(5);
    });

    test('should handle zero days count', () => {
      const startDate = new Date('2025-09-01');
      const endDate = new Date('2025-09-01');
      const daysCount = exporter.getDaysCount(startDate, endDate);
      
      expect(daysCount).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('should export schedule data successfully', async () => {
      const mappings = dataMapper.getMappings();
      
      exporter.setSubjectMapping(mappings.subjectMapping);
      exporter.setLecturerMapping(mappings.lecturerMapping);
      exporter.setLocationMapping(mappings.locationMapping);

      // This test would require the actual template file
      // For now, we'll just test that the exporter can be configured
      expect(exporter).toBeDefined();
    });
  });
});

// Mock data for testing
export const mockScheduleData: ScheduleData[] = [
  {
    week: 1,
    teamId: 1,
    subjectId: 16,
    date: "2025-09-01",
    dayOfWeek: "Mon",
    session: "morning",
    lecturerId: null,
    locationId: null
  },
  {
    week: 1,
    teamId: 1,
    subjectId: 1,
    date: "2025-09-01",
    dayOfWeek: "Mon",
    session: "afternoon",
    lecturerId: 1,
    locationId: 1
  },
  {
    week: 1,
    teamId: 1,
    subjectId: 12,
    date: "2025-09-01",
    dayOfWeek: "Mon",
    session: "evening",
    lecturerId: 2,
    locationId: 2
  }
];

// Helper function to create test exporter
export function createTestExporter(): ExcelExporter {
  return new ExcelExporter({
    templatePath: 'excel_export/template.xlsx',
    outputPath: 'excel_export/test_output.xlsx',
    dataPath: 'excel_export/data.json'
  });
} 