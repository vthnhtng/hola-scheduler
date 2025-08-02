import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import { 
  ScheduleData, 
  DateRange, 
  ExcelConfig, 
  CellPosition, 
  MergedCellRange,
  SubjectMapping,
  LecturerMapping,
  LocationMapping
} from '../types/ExcelExportTypes.js';

export class ExcelExporter {
  private config: ExcelConfig;
  private workbook: ExcelJS.Workbook | null = null;
  private worksheet: ExcelJS.Worksheet | null = null;
  private data: ScheduleData[] = [];
  private subjectMapping: SubjectMapping = {};
  private lecturerMapping: LecturerMapping = {};
  private locationMapping: LocationMapping = {};

  constructor(config: Partial<ExcelConfig> = {}) {
    this.config = {
      templatePath: 'excel_export/template.xlsx',
      outputPath: 'excel_export/output.xlsx',
      dataPath: 'excel_export/data.json',
      worksheetIndex: 1,
      dayColumn: 'A',
      timeSlotColumn: 'B',
      firstTimeSlotRow: 4,
      rowPerTimeSlot: 1,
      timeSlots: ['S', 'C', 'T'],
      ...config
    };
  }

  /**
   * Set subject mapping for converting subject IDs to names
   */
  setSubjectMapping(mapping: SubjectMapping): void {
    this.subjectMapping = mapping;
  }

  /**
   * Set lecturer mapping for converting lecturer IDs to names
   */
  setLecturerMapping(mapping: LecturerMapping): void {
    this.lecturerMapping = mapping;
  }

  /**
   * Set location mapping for converting location IDs to names
   */
  setLocationMapping(mapping: LocationMapping): void {
    this.locationMapping = mapping;
  }

  /**
   * Read JSON data from file
   */
  async readData(): Promise<ScheduleData[]> {
    try {
      const jsonString = await fs.readFile(this.config.dataPath, 'utf8');
      this.data = JSON.parse(jsonString);
      return this.data;
    } catch (error) {
      console.error('Error reading JSON file:', error);
      throw new Error(`Failed to read data file: ${this.config.dataPath}`);
    }
  }

  /**
   * Load Excel template
   */
  async loadTemplate(): Promise<void> {
    try {
      this.workbook = new ExcelJS.Workbook();
      await this.workbook.xlsx.readFile(this.config.templatePath);
      const worksheet = this.workbook.getWorksheet(this.config.worksheetIndex);
      
      if (!worksheet) {
        throw new Error(`Worksheet at index ${this.config.worksheetIndex} not found`);
      }
      
      this.worksheet = worksheet;
    } catch (error) {
      console.error('Error loading Excel template:', error);
      throw new Error(`Failed to load template: ${this.config.templatePath}`);
    }
  }

  /**
   * Get start and end dates from data
   */
  getDateRange(): DateRange {
    if (this.data.length === 0) {
      throw new Error('No data available. Please read data first.');
    }

    const start = this.data[0];
    const end = this.data[this.data.length - 1];

    return { start, end };
  }

  /**
   * Calculate number of days between two dates
   */
  getDaysCount(startDate: Date, endDate: Date): number {
    if (startDate >= endDate) {
      return 0;
    }

    const timeDiff = endDate.getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return dayDiff;
  }

  /**
   * Fill a cell with value
   */
  fillCell(cell: string, value: string | number): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }
    this.worksheet.getCell(cell).value = value;
  }

  /**
   * Merge cells and set value
   */
  mergeCells(startCell: string, endCell: string, value: string): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }
    this.worksheet.mergeCells(startCell, endCell);
    this.fillCell(startCell, value);
  }

  /**
   * Fill days and time slots in the worksheet
   */
  fillDays(): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }

    const { start, end } = this.getDateRange();
    const dates = Array.from(new Set(this.data.map(item => item.date)));
    const { dayColumn, timeSlotColumn, firstTimeSlotRow, rowPerTimeSlot, timeSlots } = this.config;

    const daysNumber = this.getDaysCount(new Date(start.date), new Date(end.date));

    for (let i = 0; i < dates.length; i++) {
      const startRow = firstTimeSlotRow + i * rowPerTimeSlot * timeSlots.length;
      const endRow = startRow + rowPerTimeSlot * timeSlots.length - 1;

      // Fill time slots
      timeSlots.forEach((slot, index) => {
        this.fillCell(`${timeSlotColumn}${String(startRow + index)}`, slot);
      });

      // Merge day cells
      this.mergeCells(
        `${dayColumn}${String(startRow)}`,
        `${dayColumn}${String(endRow)}`,
        this.formatDayCell(dates[i])
      );
    }
  }

  /**
   * Format day cell with day name and date
   */
  private formatDayCell(dateString: string): string {
    const dateObject = new Date(dateString);
    const day = dateObject.toLocaleDateString('en-US', { weekday: 'short' });
    const dateExcelValue = dateObject.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    return `${day}\n${dateExcelValue}`;
  }

  /**
   * Fill period data (subjects, lecturers, locations)
   */
  fillPeriodData(): void {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }

    const { firstTimeSlotRow, rowPerTimeSlot, timeSlots } = this.config;
    const dates = Array.from(new Set(this.data.map(item => item.date)));

    // Group data by date and session
    const groupedData = this.groupDataByDateAndSession();

    dates.forEach((date, dateIndex) => {
      const startRow = firstTimeSlotRow + dateIndex * rowPerTimeSlot * timeSlots.length;
      
      timeSlots.forEach((slot, slotIndex) => {
        const row = startRow + slotIndex;
        const session = this.mapTimeSlotToSession(slot);
        const dayData = groupedData[date]?.[session];

        if (dayData) {
          this.fillPeriodRow(row, dayData);
        }
      });
    });
  }

  /**
   * Group data by date and session
   */
  private groupDataByDateAndSession(): Record<string, Record<string, ScheduleData>> {
    const grouped: Record<string, Record<string, ScheduleData>> = {};

    this.data.forEach(item => {
      if (!grouped[item.date]) {
        grouped[item.date] = {};
      }
      grouped[item.date][item.session] = item;
    });

    return grouped;
  }

  /**
   * Map time slot to session
   */
  private mapTimeSlotToSession(slot: string): string {
    const slotMap: Record<string, string> = {
      'S': 'morning',
      'C': 'afternoon', 
      'T': 'evening'
    };
    return slotMap[slot] || 'morning';
  }

  /**
   * Fill a single period row with subject, lecturer, and location
   */
  private fillPeriodRow(row: number, data: ScheduleData): void {
    const subjectName = this.subjectMapping[data.subjectId] || `Subject ${data.subjectId}`;
    const lecturerName = data.lecturerId ? 
      (this.lecturerMapping[data.lecturerId] || `Lecturer ${data.lecturerId}`) : 
      'TBD';
    const locationName = data.locationId ? 
      (this.locationMapping[data.locationId] || `Location ${data.locationId}`) : 
      'TBD';

    // Fill subject (column C)
    this.fillCell(`C${row}`, subjectName);
    
    // Fill lecturer (column D)
    this.fillCell(`D${row}`, lecturerName);
    
    // Fill location (column E)
    this.fillCell(`E${row}`, locationName);
  }

  /**
   * Save workbook to file
   */
  async saveWorkbook(): Promise<void> {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }

    try {
      await this.workbook.xlsx.writeFile(this.config.outputPath);
      console.log(`Excel file saved successfully: ${this.config.outputPath}`);
    } catch (error) {
      console.error('Error saving Excel file:', error);
      throw new Error(`Failed to save Excel file: ${this.config.outputPath}`);
    }
  }

  /**
   * Complete export process
   */
  async export(): Promise<void> {
    try {
      console.log('Starting Excel export process...');
      
      // Read data
      await this.readData();
      console.log(`Loaded ${this.data.length} schedule entries`);
      
      // Load template
      await this.loadTemplate();
      console.log('Excel template loaded successfully');
      
      // Fill days and time slots
      this.fillDays();
      console.log('Days and time slots filled');
      
      // Fill period data
      this.fillPeriodData();
      console.log('Period data filled');
      
      // Save workbook
      await this.saveWorkbook();
      console.log('Export completed successfully');
      
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Get the current worksheet for advanced operations
   */
  getWorksheet(): ExcelJS.Worksheet {
    if (!this.worksheet) {
      throw new Error('Worksheet not loaded');
    }
    return this.worksheet;
  }

  /**
   * Get the current workbook for advanced operations
   */
  getWorkbook(): ExcelJS.Workbook {
    if (!this.workbook) {
      throw new Error('Workbook not loaded');
    }
    return this.workbook;
  }
} 